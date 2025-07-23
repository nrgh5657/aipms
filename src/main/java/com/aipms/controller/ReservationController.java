package com.aipms.controller;

import com.aipms.dto.PageDto;
import com.aipms.dto.ReservationDto;
import com.aipms.security.CustomUserDetails;
import com.aipms.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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


    @PutMapping("/cancel/{reservationId}")
    public ResponseEntity<String> cancel(@PathVariable Long reservationId) {
        reservationService.cancelReservation(reservationId);
        return ResponseEntity.ok("예약 취소 완료");
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
}
