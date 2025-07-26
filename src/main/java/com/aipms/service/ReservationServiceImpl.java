package com.aipms.service;

import com.aipms.domain.Payment;
import com.aipms.domain.Reservation;
import com.aipms.dto.ReservationDto;
import com.aipms.dto.ReservationHistoryDto;
import com.aipms.dto.ReservationHistoryRequestDto;
import com.aipms.mapper.PaymentMapper;
import com.aipms.mapper.ReservationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    private final ReservationMapper reservationMapper;
    private final PaymentMapper paymentMapper;
    private final IamportService iamportService;
    private final ParkingAvailabilityService parkingAvailabilityService;

    @Override
    public void makeReservation(ReservationDto dto) {

        int overlap = reservationMapper.countOverlappingReservation(dto.getMemberId(), dto.getReservationStart(), dto.getReservationEnd());
        if (overlap > 0) {
            throw new IllegalStateException("해당 기간에 이미 예약이 존재합니다.");
        }
        int available = parkingAvailabilityService.getAvailableNormalSpots();
        if (available <= 0) {
            throw new IllegalStateException("잔여 주차 공간이 없습니다.");
        }

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

    @Override
    public void processReservationRefund(Long reservationId, String reason, Long memberId) {
        Reservation reservation = reservationMapper.findByIdAndMemberId(reservationId, memberId);
        if (reservation == null || !reservation.getStatus().equals("PAID")) {
            throw new IllegalStateException("유효하지 않은 예약입니다.");
        }

        Payment payment = paymentMapper.findByReservationId(reservationId);
        if (payment == null || !payment.getStatus().equals("결제 완료")) {
            throw new IllegalStateException("결제 정보가 없습니다.");
        }

        // 1시간 이내 확인
        if (Duration.between(payment.getPaymentTime(), LocalDateTime.now()).toMinutes() > 60) {
            throw new IllegalStateException("결제 1시간 이후에는 환불할 수 없습니다.");
        }
        int fee = reservation.getFee();
        LocalDate today = LocalDate.now();
        LocalDate resDate = reservation.getReservationStart().toLocalDate();

        // 예약일 기준 위약금 계산
        long daysBetween = ChronoUnit.DAYS.between(today, resDate);
        int penalty;

        if (daysBetween >= 2) {
            penalty = 0;
        } else if (daysBetween == 1) {
            penalty = 1000;
        } else if (daysBetween == 0) {
            penalty = 3000;
        } else {
            throw new IllegalStateException("이미 지난 예약은 환불할 수 없습니다.");
        }
        int refundAmount = Math.max(fee - penalty, 0);

        // 아임포트 환불 요청
        iamportService.refund(payment.getImpUid(), refundAmount);

        // DB 상태 업데이트
        paymentMapper.markAsCancelled(payment.getPaymentId(), reason, refundAmount);
        reservationMapper.cancelReservation(reservationId, reason, refundAmount);

    }

    @Override
    public List<ReservationHistoryDto> getPagedReservationHistory(ReservationHistoryRequestDto dto) {
        return reservationMapper.getPagedReservationHistory(dto);
    }

    @Override
    public int countReservationHistory(ReservationHistoryRequestDto dto) {
        return reservationMapper.countReservationHistory(dto);
    }

    @Override
    public boolean hasDailyReservationToday(Long memberId, LocalDateTime entryTime) {
        LocalDate date = entryTime.toLocalDate();
        return reservationMapper.existsTodayReservation(memberId, date) > 0;
    }

    @Override
    public boolean hasOverlappingReservation(Long memberId, LocalDateTime start, LocalDateTime end) {
        return reservationMapper.countOverlappingReservation(memberId, start, end) > 0;
    }

}
