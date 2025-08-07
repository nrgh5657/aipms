package com.aipms.controller;

import com.aipms.dto.*;
import com.aipms.security.CustomUserDetails;
import com.aipms.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping("/daily")
    public ResponseEntity<Map<String, Object>> applyDaily(@AuthenticationPrincipal CustomUserDetails user,
                                                          @RequestBody ReservationDto dto) {
        dto.setMemberId(user.getMember().getMemberId());

        Map<String, Object> response = new HashMap<>();

        try {
            reservationService.createDailyReservation(dto);
            response.put("success", true);
            response.put("message", "예약 신청 완료");
            return ResponseEntity.ok(response);

        } catch (IllegalStateException e) {
            response.put("success", false);
            response.put("message", e.getMessage());

            String msg = e.getMessage();
            String reason;

            // ✅ "일반 주차 공간 부족: [2025-08-20, ...]" 메시지인 경우
            if (msg.startsWith("일반 주차 공간 부족")) {
                reason = "NO_AVAILABLE_SPOTS";

                // ⛔ 부족한 날짜 리스트 추출 (문자열에서 파싱)
                int start = msg.indexOf("[");
                int end = msg.indexOf("]");
                if (start != -1 && end != -1 && end > start) {
                    String datesStr = msg.substring(start + 1, end);
                    String[] dates = datesStr.split(",\\s*");
                    response.put("insufficientDates", dates);  // → 프론트에 전달
                }

            } else {
                // ✅ 기타 메시지 매핑
                reason = switch (msg) {
                    case "예약은 최소 하루 전부터 가능합니다." -> "DATE_PASSED";
                    case "종료일은 시작일보다 이후여야 합니다." -> "INVALID_DATE_RANGE";
                    case "해당 기간에 이미 예약이 존재합니다." -> "DUPLICATE_RESERVATION";
                    case "일주차 요금 정책이 설정되어 있지 않습니다." -> "NO_POLICY";
                    default -> "UNKNOWN_ERROR";
                };
            }

            response.put("reason", reason);
            return ResponseEntity.ok(response);
        }
    }


    @PostMapping("/monthly")
    public ResponseEntity<Map<String, Object>> applyMonthly(@AuthenticationPrincipal CustomUserDetails user,
                                                            @RequestBody ReservationDto dto) {
        dto.setMemberId(user.getMember().getMemberId());

        Map<String, Object> response = new HashMap<>();

        try {
            reservationService.createMonthlyReservation(dto);  // ✅ 예약 로직
            response.put("success", true);
            response.put("message", "월주차 예약이 완료되었습니다.");
            return ResponseEntity.ok(response);

        } catch (IllegalStateException e) {
            response.put("success", false);
            response.put("message", e.getMessage());

            // 💬 메시지에 맞춰 reason 코드도 새로 구성
            String reason = switch (e.getMessage()) {
                case "현재 월주차 예약 가능 기간이 아닙니다." -> "OUT_OF_PERIOD";
                case "이미 해당 월에 월주차가 예약되어 있습니다." -> "DUPLICATE_RESERVATION";
                case "정기권 주차 공간이 부족합니다." -> "NO_AVAILABLE_SPOTS";
                case "월주차 요금 정책이 설정되어 있지 않습니다." -> "NO_POLICY";
                default -> "UNKNOWN_ERROR";
            };
            response.put("reason", reason);

            return ResponseEntity.ok(response);
        }
    }






    @GetMapping("/{memberId}")
    public ResponseEntity<PageDto<ReservationDto>> getByMember(
            @PathVariable Long memberId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        List<ReservationDto> allReservations = reservationService.getReservationsByMember(memberId);
        int totalItems = allReservations.size();
        int totalPages = (int) Math.ceil((double) totalItems / size);

        int fromIndex = (page - 1) * size;
        int toIndex = Math.min(fromIndex + size, totalItems);
        List<ReservationDto> pagedReservations = allReservations.subList(fromIndex, toIndex);

        PageDto<ReservationDto> pageDto = new PageDto<>(
                pagedReservations,
                totalItems,
                page,
                size
        );

        return ResponseEntity.ok(pageDto);
    }

    @GetMapping("/current")
    public ResponseEntity<?> getCurrentReservation(@AuthenticationPrincipal CustomUserDetails user) {
        ReservationDto dto = reservationService.getActiveReservation(user.getMember().getMemberId());

        Map<String, Object> response = new HashMap<>();
        response.put("reservation", dto); // null 가능
        return ResponseEntity.ok(response);
    }



    @PutMapping("/status/{reservationId}")
    public ResponseEntity<String> updateStatus(@PathVariable Long reservationId,
                                               @RequestParam String status) {
        reservationService.updateStatus(reservationId, status);
        return ResponseEntity.ok("예약 상태 변경 완료");
    }

    @GetMapping("/list")
    public ResponseEntity<List<ReservationDto>> getAll() {
        return ResponseEntity.ok(reservationService.getAllReservations());
    }

    @PostMapping("/refund")
    public ResponseEntity<?> refundReservation(@RequestBody ReservationRefundRequestDto dto,
                                               @AuthenticationPrincipal CustomUserDetails user) {
        try {
            reservationService.processReservationRefund(dto.getReservationId(), dto.getReason(), user.getMember().getMemberId());
            return ResponseEntity.ok(Map.of("success", true, "message", "환불이 완료되었습니다."));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "서버 오류"));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getReservationHistory(
            @AuthenticationPrincipal CustomUserDetails user,
            ReservationHistoryRequestDto dto
    ) {
        dto.setMemberId(user.getMember().getMemberId());

        List<ReservationHistoryDto> reservations = reservationService.getPagedReservationHistory(dto);
        int total = reservationService.countReservationHistory(dto);

        Map<String, Object> result = new HashMap<>();
        result.put("reservations", reservations);
        result.put("pagination", Map.of(
                "totalCount", total,
                "totalPages", (int) Math.ceil((double) total / dto.getLimit()),
                "currentPage", dto.getPage()
        ));

        return ResponseEntity.ok(result);
    }

    //중복 예약 체크
    @GetMapping("/check-overlap")
    public ResponseEntity<?> checkReservationOverlap(@AuthenticationPrincipal CustomUserDetails user,
                                                     @RequestParam LocalDateTime startDate,
                                                     @RequestParam LocalDateTime endDate) {
        boolean overlap = reservationService.hasOverlappingReservation(user.getMember().getMemberId(), startDate, endDate);
        return ResponseEntity.ok(Map.of("available", !overlap));
    }

    @GetMapping("pay/{reservationId}")
    public ResponseEntity<ReservationDto> getReservationById(@PathVariable Long reservationId,
                                                             @AuthenticationPrincipal CustomUserDetails user) {
        ReservationDto dto = reservationService.getReservationById(reservationId);

        // 🔐 보안처리: 자기 예약인지 확인
        if (!dto.getMemberId().equals(user.getMember().getMemberId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/unpaid/daily")
    public ResponseEntity<List<ReservationDto>> getUnpaidDailyReservations(
            @AuthenticationPrincipal CustomUserDetails user) {

        Long memberId = user.getMember().getMemberId(); // ✅ 로그인 사용자 ID
        List<ReservationDto> unpaidDailyReservations = reservationService.getUnpaidDailyReservations(memberId);
        return ResponseEntity.ok(unpaidDailyReservations);
    }

    @GetMapping("/unpaid/monthly")
    public ResponseEntity<List<ReservationDto>> getUnpaidMonthlyReservations(
            @AuthenticationPrincipal CustomUserDetails user) {

        Long memberId = user.getMember().getMemberId(); // ✅ 로그인 사용자 ID
        List<ReservationDto> unpaidMonthlyReservations = reservationService.getUnpaidMonthlyReservations(memberId);
        return ResponseEntity.ok(unpaidMonthlyReservations);
    }


}
