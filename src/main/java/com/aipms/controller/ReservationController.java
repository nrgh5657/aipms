package com.aipms.controller;

import com.aipms.dto.ReservationDto;
import com.aipms.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping("/apply")
    public ResponseEntity<String> apply(@RequestBody ReservationDto dto) {
        reservationService.makeReservation(dto);
        return ResponseEntity.ok("예약 신청 완료");
    }

    @GetMapping("/{memberId}")
    public ResponseEntity<List<ReservationDto>> getByMember(@PathVariable Long memberId) {
        return ResponseEntity.ok(reservationService.getReservationsByMember(memberId));
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
