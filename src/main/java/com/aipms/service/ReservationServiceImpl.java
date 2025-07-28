package com.aipms.service;

import com.aipms.domain.Payment;
import com.aipms.domain.Reservation;
import com.aipms.dto.*;
import com.aipms.mapper.PaymentMapper;
import com.aipms.mapper.RefundPolicyMapper;
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
    private final RefundPolicyMapper refundPolicyMapper;
    private final FeePolicyService feePolicyService;

    @Override
    public void createDailyReservation(ReservationDto dto) {

        // ✅ 오늘 날짜 기준 비교
        LocalDate today = LocalDate.now();
        LocalDate reservationDate = dto.getReservationStart().toLocalDate();

        if (!reservationDate.isAfter(today)) {
            throw new IllegalStateException("예약은 최소 하루 전부터 가능합니다.");
        }

        // ✅ 중복 체크
        int overlap = reservationMapper.countOverlappingReservation(dto.getMemberId(), dto.getReservationStart(), dto.getReservationEnd());
        if (overlap > 0) {
            throw new IllegalStateException("해당 기간에 이미 예약이 존재합니다.");
        }

        // ✅ 공간 체크
        int available = parkingAvailabilityService.getAvailableNormalSpots();
        if (available <= 0) {
            throw new IllegalStateException("잔여 주차 공간이 없습니다.");
        }
        FeePolicyDto policy = feePolicyService.getActivePolicyByType("DAILY");
        if (policy == null) {
            throw new IllegalStateException("일주차 요금 정책이 설정되어 있지 않습니다.");
        }
        int dailyFee = policy.getBaseFee();

        // ✅ 예약 정보 저장 (결제 X)
        Reservation reservation = new Reservation();
        reservation.setMemberId(dto.getMemberId());
        reservation.setVehicleNumber(dto.getVehicleNumber());
        reservation.setReservationStart(dto.getReservationStart());
        reservation.setReservationEnd(dto.getReservationEnd());
        reservation.setStatus("UNPAID"); // 🔸 결제 안 됨
        reservation.setFee(dailyFee);       // 고정
        reservation.setType("DAILY");    // 🔸 일주차 표시

        reservationMapper.insertReservation(reservation);
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
    public int countActiveReservations() {
        return reservationMapper.countActiveReservations();
    }

    @Override
    public ReservationDto getActiveReservation(Long memberId) {
        LocalDateTime now = LocalDateTime.now();
        return reservationMapper.findUpcomingReservation(memberId, now); // ✅ 그대로 리턴
    }

    @Override
    public void processReservationRefund(Long reservationId, String reason, Long memberId) {
        Reservation reservation = reservationMapper.findByIdAndMemberId(reservationId, memberId);
        if (reservation == null || !"PAID".equals(reservation.getStatus())) {
            throw new IllegalStateException("유효하지 않은 예약입니다.");
        }

        Payment payment = paymentMapper.findByReservationId(reservationId);
        if (payment == null || !"결제 완료".equals(payment.getStatus())) {
            throw new IllegalStateException("결제 정보가 없습니다.");
        }

        // 🔸 환불 정책 불러오기
        RefundPolicyDto policy = refundPolicyMapper.findActivePolicy();
        if (policy == null) {
            throw new IllegalStateException("적용 가능한 환불 정책이 없습니다.");
        }

        int refundLimit = policy.getRefundTimeLimitMinutes(); // ex: 60
        double penalty1Day = policy.getPenaltyBefore1day();   // ex: 0.1
        double penaltySameDay = policy.getPenaltySameOrAfter(); // ex: 1.0 == 환불불가

        // 🔸 결제 시간으로부터 경과 시간 확인
        long minutesSincePayment = Duration.between(payment.getPaymentTime(), LocalDateTime.now()).toMinutes();
        if (minutesSincePayment > refundLimit) {
            throw new IllegalStateException("결제 " + refundLimit + "분 이후에는 환불할 수 없습니다.");
        }

        int originalFee = reservation.getFee();
        LocalDate today = LocalDate.now();
        LocalDate reservationDate = reservation.getReservationStart().toLocalDate();

        long daysBefore = ChronoUnit.DAYS.between(today, reservationDate);
        double penaltyRatio;

// 전액 환불 조건: 결제 후 일정 시간 이내
        if (minutesSincePayment <= refundLimit) {
            penaltyRatio = 0.0;
        } else {
            if (daysBefore >= 2) {
                penaltyRatio = 0.0;
            } else if (daysBefore == 1) {
                penaltyRatio = penalty1Day;
            } else if (daysBefore == 0) {
                penaltyRatio = penaltySameDay;
                if (penaltyRatio >= 1.0) {
                    throw new IllegalStateException("예약 당일은 환불이 불가능합니다.");
                }
            } else {
                throw new IllegalStateException("이미 지난 예약은 환불할 수 없습니다.");
            }
        }

        int refundAmount = (int) Math.max(originalFee * (1 - penaltyRatio), 0);

        // 🔸 아임포트 환불 요청
        iamportService.refund(payment.getImpUid(), refundAmount);

        // 🔸 DB 업데이트
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

    @Override
    public int cancelExpiredUnpaidReservations() {
        return reservationMapper.cancelUnpaidExpiredReservations();
    }

    @Override
    public ReservationDto getReservationById(Long reservationId) {
        return reservationMapper.selectReservationById(reservationId);
    }

}
