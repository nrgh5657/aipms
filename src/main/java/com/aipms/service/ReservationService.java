package com.aipms.service;

import com.aipms.dto.ReservationDto;

import java.util.List;

public interface ReservationService {
    void makeReservation(ReservationDto dto);
    List<ReservationDto> getReservationsByMember(Long memberId);
    void cancelReservation(Long reservationId);
    void updateStatus(Long reservationId, String status);
    List<ReservationDto> getAllReservations();
}
