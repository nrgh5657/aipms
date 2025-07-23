package com.aipms.service;

import com.aipms.domain.Payment;
import com.aipms.domain.Reservation;
import com.aipms.dto.ReservationDto;
import com.aipms.mapper.PaymentMapper;
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
    private final PaymentMapper paymentMapper;

    @Override
    public void makeReservation(ReservationDto dto) {
        // 1. 예약 정보 저장
        Reservation reservation = new Reservation();
        reservation.setMemberId(dto.getMemberId());
        reservation.setVehicleNumber(dto.getVehicleNumber());
        reservation.setReservationStart(dto.getReservationStart());
        reservation.setReservationEnd(dto.getReservationEnd());
        reservation.setStatus("PAID");
        reservation.setFee(20000); // 고정

        reservationMapper.insertReservation(reservation); // ✅ 예약 저장
        Long reservationId = reservation.getReservationId(); // PK 가져오기 (useGeneratedKeys=true)

        // 2. 결제 정보 저장
        Payment payment = new Payment();
        payment.setMemberId(dto.getMemberId());
        payment.setReservationId(reservationId); // ✅ 예약 ID 연동
        payment.setTotalFee(20000);
        payment.setPaymentMethod(dto.getPaymentMethod()); // JS에서 넘겨줘야 함
        payment.setGateway(dto.getGateway());
        payment.setPaid(true);
        payment.setStatus("결제 완료");
        payment.setPaymentType("일주차"); // 고정
        payment.setMerchantUid(dto.getMerchantUid());
        payment.setImpUid(dto.getImpUid());
        payment.setPaymentTime(LocalDateTime.now());
        payment.setCarNumber(dto.getVehicleNumber());

        paymentMapper.insertPayment(payment);
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
        return reservationMapper.findUpcomingReservation(memberId, now); // ✅ 그대로 리턴
    }

}
