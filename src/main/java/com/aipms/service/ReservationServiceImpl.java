package com.aipms.service;

import com.aipms.domain.Payment;
import com.aipms.domain.Reservation;
import com.aipms.dto.*;
import com.aipms.mapper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservationServiceImpl implements ReservationService {

    private final ReservationMapper reservationMapper;
    private final PaymentMapper paymentMapper;
    private final IamportService iamportService;
    private final ParkingAvailabilityService parkingAvailabilityService;
    private final RefundPolicyMapper refundPolicyMapper;
    private final FeePolicyService feePolicyService;
    private final FeePolicyMapper feePolicyMapper;
    private final SubscriptionMapper subscriptionMapper;
    private final MemberMapper memberMapper;

    @Override
    public void createDailyReservation(ReservationDto dto) {
        LocalDate today = LocalDate.now();
        LocalDate start = dto.getReservationStart().toLocalDate();
        LocalDate end = dto.getReservationEnd().toLocalDate();

        if (!start.isAfter(today)) {
            throw new IllegalStateException("예약은 최소 하루 전부터 가능합니다.");
        }

        if (end.isBefore(start)) {
            throw new IllegalStateException("종료일은 시작일보다 이후여야 합니다.");
        }

        // ✅ 중복 예약 체크
        int overlap = reservationMapper.countOverlappingReservation(dto.getMemberId(), dto.getReservationStart(), dto.getReservationEnd());
        if (overlap > 0) {
            throw new IllegalStateException("해당 기간에 이미 예약이 존재합니다.");
        }

        // ✅ 예약 기간 공간 검사 (기간 기반 체크로 변경)
        boolean reservable = parkingAvailabilityService.isReservableForPeriod(start, end);
        if (!reservable) {
            throw new IllegalStateException("예약 기간 중 일부 날짜에 주차 공간이 부족합니다.");
        }

        // ✅ 요금 정책 조회
        FeePolicyDto policy = feePolicyService.getActivePolicyByType("DAILY");
        if (policy == null) {
            throw new IllegalStateException("일주차 요금 정책이 설정되어 있지 않습니다.");
        }
        int dailyFee = policy.getBaseFee();

        // ✅ 예약 정보 저장 (결제 전)
        Reservation reservation = new Reservation();
        reservation.setMemberId(dto.getMemberId());
        reservation.setVehicleNumber(dto.getVehicleNumber());
        reservation.setReservationStart(dto.getReservationStart());
        reservation.setReservationEnd(dto.getReservationEnd());
        reservation.setStatus("UNPAID");
        reservation.setFee(dailyFee);
        reservation.setType("DAILY");

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

        RefundPolicyDto policy = refundPolicyMapper.findActivePolicy();
        if (policy == null) {
            throw new IllegalStateException("적용 가능한 환불 정책이 없습니다.");
        }

        int refundLimit = policy.getRefundTimeLimitMinutes();         // 예: 60
        double penalty1Day = policy.getPenaltyBefore1day();           // 예: 0.1
        double penaltySameDay = policy.getPenaltySameOrAfter();       // 예: 1.0

        LocalDate today = LocalDate.now();
        LocalDate reservationDate = reservation.getReservationStart().toLocalDate();
        long daysBefore = ChronoUnit.DAYS.between(today, reservationDate);
        long minutesSincePayment = Duration.between(payment.getPaymentTime(), LocalDateTime.now()).toMinutes();

        int originalFee = reservation.getFee();
        double penaltyRatio;

        // ✅ 조건 1: 결제 후 60분 이내 → 무조건 전액 환불
        if (minutesSincePayment <= refundLimit) {
            penaltyRatio = 0.0;

            // ✅ 조건 2: 예약일 기준 정책 적용
        } else {
            if (daysBefore >= 2) {
                penaltyRatio = 0.0; // 전액 환불
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
        boolean success = iamportService.refund(payment.getImpUid(), refundAmount);
        if (!success) {
            throw new IllegalStateException("환불 처리에 실패했습니다. 관리자에게 문의해주세요.");
        }

        // 🔸 DB 업데이트
        paymentMapper.markAsCancelled(payment.getPaymentId(), reason, refundAmount);
        reservationMapper.cancelReservation(reservationId, reason, refundAmount);

        // ✅ 정기권 삭제 및 회원 상태 초기화 (월주차일 경우에만)
        if ("SUBSCRIPTION".equalsIgnoreCase(reservation.getType())) {
            // 정기권 테이블에서 해당 회원의 정기권 삭제
            subscriptionMapper.deleteByMemberId(memberId);

            // 멤버 테이블에서 정기권 보유 여부 해제
            memberMapper.updateSubscriptionStatus(memberId, false);
        }
    }


    @Override
    public List<ReservationHistoryDto> getPagedReservationHistory(ReservationHistoryRequestDto dto) {
        List<ReservationHistoryDto> list = reservationMapper.getPagedReservationHistory(dto);
        RefundPolicyDto policy = refundPolicyMapper.findActivePolicy();

        for (ReservationHistoryDto reservation : list) {
            if (!"PAID".equals(reservation.getStatus())) continue;

            Payment payment = paymentMapper.findByReservationId(reservation.getId());
            if (payment == null) continue;

            int expectedRefund = calculateExpectedRefundAmount(reservation, payment, policy);
            reservation.setExpectedRefundAmount(expectedRefund); // ✅ 필드가 있어야 함
        }

        return list;
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

    @Override
    public List<ReservationDto> getUnpaidDailyReservations(Long memberId) {
        return reservationMapper.selectUnpaidDailyReservations(memberId);
    }

    @Override
    public List<ReservationDto> getUnpaidMonthlyReservations(Long memberId) {
        return reservationMapper.selectUnpaidMonthlyReservations(memberId);
    }

    @Override
    public Integer calculateExpectedRefundAmount(ReservationHistoryDto reservation, Payment payment, RefundPolicyDto policy) {
        if (reservation == null || payment == null || policy == null) return null;

        int originalFee = reservation.getFee();
        long minutesSincePayment = Duration.between(payment.getPaymentTime(), LocalDateTime.now()).toMinutes();
        LocalDate today = LocalDate.now();
        LocalDate reservationDate = reservation.getReservationStart().toLocalDate();
        long daysBefore = ChronoUnit.DAYS.between(today, reservationDate);

        double penaltyRatio = 0.0;

        if (minutesSincePayment <= policy.getRefundTimeLimitMinutes()) {
            penaltyRatio = 0.0;
        } else {
            if (daysBefore >= 2) penaltyRatio = 0.0;
            else if (daysBefore == 1) penaltyRatio = policy.getPenaltyBefore1day();
            else if (daysBefore == 0) penaltyRatio = policy.getPenaltySameOrAfter();
            else return 0; // 이미 지난 예약
        }

        return (int) Math.max(originalFee * (1 - penaltyRatio), 0);
    }

    @Override
    public void createMonthlyReservation(ReservationDto dto) {

        // ✅ 오늘 기준 월주차 예약 가능한 달 확인
        LocalDate today = LocalDate.now();
        YearMonth thisMonth = YearMonth.from(today);
        YearMonth nextMonth = thisMonth.plusMonths(1); // 예: 7월이면 8월 예약만 허용


        log.info("🚩 예약 요청 시작일: {}", dto.getReservationStart());
        log.info("📅 서버 기준 현재 월: {}", YearMonth.now());
        log.info("📅 비교 대상 (다음 달): {}", YearMonth.now().plusMonths(1));
        log.info("📅 요청된 월: {}", YearMonth.from(dto.getReservationStart().toLocalDate()));

        YearMonth requestedMonth = YearMonth.from(dto.getReservationStart().toLocalDate());
        if (!requestedMonth.equals(nextMonth)) {
            throw new IllegalStateException("현재 월주차 예약 가능 기간이 아닙니다.");
        }

        // ✅ 중복 예약 체크 (해당 월에 이미 예약 존재 여부)
        LocalDate startOfMonth = requestedMonth.atDay(1);
        int overlap = reservationMapper.countMonthlyReservation(dto.getMemberId(), startOfMonth);
        if (overlap > 0) {
            throw new IllegalStateException("이미 해당 월에 월주차가 예약되어 있습니다.");
        }

        // ✅ 정기권 공간 체크
        int available = parkingAvailabilityService.getAvailableFixedSpots();
        if (available <= 0) {
            throw new IllegalStateException("정기권 주차 공간이 부족합니다.");
        }

        // ✅ 요금 정책 조회
        FeePolicyDto policy = feePolicyService.getActivePolicyByType("MONTHLY");
        if (policy == null) {
            throw new IllegalStateException("월주차 요금 정책이 설정되어 있지 않습니다.");
        }

        int monthlyFee = policy.getBaseFee();
        LocalDate startDate = requestedMonth.atDay(1);
        LocalDate endDate = requestedMonth.atEndOfMonth();

        // ✅ 예약 정보 저장 (결제 X)
        Reservation reservation = new Reservation();
        reservation.setMemberId(dto.getMemberId());
        reservation.setVehicleNumber(dto.getVehicleNumber());
        reservation.setReservationStart(startDate.atStartOfDay());
        reservation.setReservationEnd(endDate.atTime(23, 59));
        reservation.setStatus("UNPAID");
        reservation.setFee(monthlyFee);
        reservation.setType("MONTHLY"); // 🔸 월주차 표시

        reservationMapper.insertReservation(reservation);
    }


}
