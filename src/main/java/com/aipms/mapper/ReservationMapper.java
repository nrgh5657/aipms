package com.aipms.mapper;

import com.aipms.domain.Reservation;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface ReservationMapper {
    void insertReservation(Reservation reservation);
    List<Reservation> findByMemberId(Long memberId);
    void cancelReservation(Long reservationId);
    void updateStatus(Long reservationId, String status);
    List<Reservation> findAll();
}
