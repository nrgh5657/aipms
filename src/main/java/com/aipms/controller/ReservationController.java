package com.aipms.controller;

import com.aipms.dto.*;
import com.aipms.security.CustomUserDetails;
import com.aipms.service.ReservationService;
import lombok.RequiredArgsConstructor;
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

    @PostMapping("/apply")
    public ResponseEntity<Map<String, Object>> apply(@RequestBody ReservationDto dto) {
        reservationService.makeReservation(dto);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "예약 신청 완료");

        return ResponseEntity.ok(response);
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
}
