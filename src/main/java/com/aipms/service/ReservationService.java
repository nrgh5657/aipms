package com.aipms.service;

import com.aipms.dto.ReservationDto;

import java.util.List;

public interface ReservationService {
    void makeReservation(ReservationDto dto);

    List<ReservationDto> getReservationsByMember(Long memberId);

    void updateStatus(Long reservationId, String status);

    List<ReservationDto> getAllReservations();

    int countPaidReservations();

    ReservationDto getActiveReservation(Long memberId);

    void processReservationRefund(Long reservationId, String reason, Long memberId);
}
