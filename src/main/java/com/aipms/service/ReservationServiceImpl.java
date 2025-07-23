package com.aipms.service;

import com.aipms.domain.Reservation;
import com.aipms.dto.ReservationDto;
import com.aipms.mapper.ReservationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    private final ReservationMapper reservationMapper;

    @Override
    public void makeReservation(ReservationDto dto) {
        Reservation r = new Reservation();
        r.setMemberId(dto.getMemberId());
        r.setVehicleNumber(dto.getVehicleNumber());
        r.setReservationStart(dto.getReservationStart());
        r.setReservationEnd(dto.getReservationEnd());
        r.setStatus("PAID");
        reservationMapper.insertReservation(r);
    }

    @Override
    public List<ReservationDto> getReservationsByMember(Long memberId) {
        return reservationMapper.findByMemberId(memberId).stream().map(r -> {
            ReservationDto dto = new ReservationDto();
            dto.setReservationId(r.getReservationId());
            dto.setMemberId(r.getMemberId());
            dto.setVehicleNumber(r.getVehicleNumber());
            dto.setReservationStart(r.getReservationStart());
            dto.setReservationEnd(r.getReservationEnd());
            dto.setStatus(r.getStatus());
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public void cancelReservation(Long reservationId) {
        reservationMapper.cancelReservation(reservationId);
    }

    @Override
    public void updateStatus(Long reservationId, String status) {
        reservationMapper.updateStatus(reservationId, status);
    }

    @Override
    public List<ReservationDto> getAllReservations() {
        return reservationMapper.findAll().stream().map(r -> {
            ReservationDto dto = new ReservationDto();
            dto.setReservationId(r.getReservationId());
            dto.setMemberId(r.getMemberId());
            dto.setVehicleNumber(r.getVehicleNumber());
            dto.setReservationStart(r.getReservationStart());
            dto.setReservationEnd(r.getReservationEnd());
            dto.setStatus(r.getStatus());
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public int countPaidReservations() {
        return reservationMapper.countPaidReservations();
    }

    @Override
    public ReservationDto getActiveReservation(Long memberId) {
        LocalDateTime now = LocalDateTime.now();
        Reservation reservation = reservationMapper.findCurrentReservation(memberId, now);

        if (reservation == null) return null;

        ReservationDto dto = new ReservationDto();
        dto.setReservationId(reservation.getReservationId());
        dto.setMemberId(reservation.getMemberId());
        dto.setVehicleNumber(reservation.getVehicleNumber());
        dto.setReservationStart(reservation.getReservationStart());
        dto.setReservationEnd(reservation.getReservationEnd());
        dto.setStatus(reservation.getStatus());

        return dto;
    }

}
