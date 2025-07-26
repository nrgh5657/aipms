package com.aipms.service;

import com.aipms.dto.ReservationDto;
import com.aipms.dto.ReservationHistoryDto;
import com.aipms.dto.ReservationHistoryRequestDto;

import java.time.LocalDateTime;
import java.util.List;

public interface ReservationService {
    void makeReservation(ReservationDto dto);

    List<ReservationDto> getReservationsByMember(Long memberId);

    void updateStatus(Long reservationId, String status);

    List<ReservationDto> getAllReservations();

    int countPaidReservations();

    ReservationDto getActiveReservation(Long memberId);

    void processReservationRefund(Long reservationId, String reason, Long memberId);

    List<ReservationHistoryDto> getPagedReservationHistory(ReservationHistoryRequestDto dto);
    int countReservationHistory(ReservationHistoryRequestDto dto);

    boolean hasDailyReservationToday(Long memberId, LocalDateTime entryTime);

    boolean hasOverlappingReservation(Long memberId, LocalDateTime start, LocalDateTime end);
}
