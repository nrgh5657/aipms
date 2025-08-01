package com.aipms.service;

import com.aipms.domain.ParkingLog;
import com.aipms.domain.Payment;
import com.aipms.domain.Reservation;
import com.aipms.domain.Subscription;
import com.aipms.dto.*;
import com.aipms.mapper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private final PaymentMapper paymentMapper;
    private final ParkingLogMapper parkingLogMapper;
    private final ParkingLogService parkingLogService;
    private final SubscriptionService subscriptionService;
    private final ReservationMapper reservationMapper;
    private final FeePolicyMapper feePolicyMapper;
    private final SubscriptionMapper subscriptionMapper;
    private final MemberMapper memberMapper;
    private final IamportService iamportService;

    @Override
    public PaymentResultDto processPayment(PaymentRequestDto requestDto) {
        Payment payment = new Payment();
        payment.setEntryId(requestDto.getEntryId());
        payment.setPaymentMethod(requestDto.getPaymentMethod());
        payment.setGateway(requestDto.getGateway());
        payment.setTotalFee(5000); // 예시 요금
        payment.setPaid(true);
        payment.setCancelled(false);
        payment.setPaymentTime(LocalDateTime.now());

        paymentMapper.insertPayment(payment);

        PaymentResultDto result = new PaymentResultDto();
        result.setPaymentId(payment.getPaymentId());
        result.setTotalFee(payment.getTotalFee());
        result.setPaid(true);
        result.setPaymentTime(payment.getPaymentTime());

        return result;
    }
    @Override
    public AccountInfoResponseDto getAccountInfo(Long memberId) {
        return paymentMapper.getAccountInfo(memberId);
    }

    @Override
    public PaymentHistoryResponseDto getPaymentHistory(PaymentHistoryRequestDto req) {
        int page = req.getPage() != null ? req.getPage() : 1;
        int limit = req.getLimit() != null ? req.getLimit() : 20;
        int offset = (page - 1) * limit;

        List<PaymentHistoryDto> payments = paymentMapper.selectPayments(req, offset, limit);
        int totalCount = paymentMapper.countPayments(req);

        PageDto<PaymentHistoryDto> pageDto = new PageDto<>(payments, totalCount, page, limit);

        return new PaymentHistoryResponseDto(payments, pageDto);
    }

    @Override
    public boolean verifyAndRecord(PaymentVerifyRequestDto dto, Long memberId) {
        Long entryId = dto.getEntryId();

        // 1. 주차 정보 조회
        ParkingLog parkingLog = parkingLogMapper.selectById(entryId);
        if (parkingLog == null) {
            log.warn("❌ 해당 entryId에 대한 주차 로그가 없습니다: {}", entryId);
            return false;
        }

        // 2. ✅ 중복 결제 방지
        Payment existing = paymentMapper.selectPaymentByEntryId(entryId);
        if (existing != null && existing.isPaid()) {
            log.warn("⚠️ 이미 결제가 완료된 entryId: {}", entryId);
            return false;
        }


        // 3. ✅ 요금 정책 기반 계산
        FeePolicyDto policy = feePolicyMapper.findActivePolicyByType("시간제");
        if (policy == null) {
            log.warn("❌ 시간제 요금 정책이 존재하지 않습니다.");
            return false;
        }

        int baseFee = policy.getBaseFee();              // ex. 1200원
        int unitMinutes = policy.getUnitTime();      // ex. 10
        Integer maxFee = policy.getMaxFee();            // ex. 7200

        long minutes = ChronoUnit.MINUTES.between(parkingLog.getEntryTime(), parkingLog.getExitTime());
        int units = (int) Math.ceil((double) minutes / unitMinutes);
        int fee = baseFee * units;

        if (maxFee != null) {
            fee = Math.min(fee, maxFee);
        }

        // ✅ 최소 보정
        if (fee < 100) {
            log.warn("🚨 요금이 너무 작아 최소 결제금액 100원으로 보정됨 (계산된 값: {})", fee);
            fee = 100;
        }

        // 4. 결제 정보 생성
        Payment payment = new Payment();
        payment.setEntryId(entryId);
        payment.setTransactionId(dto.getImpUid());
        payment.setMerchantUid(dto.getMerchantUid());
        payment.setImpUid(dto.getImpUid());
        payment.setPaid(true);
        payment.setCancelled(false);
        payment.setCarNumber(parkingLog.getCarNumber());
        payment.setPaymentMethod(dto.getMethod() != null ? dto.getMethod() : "card");
        payment.setGateway(dto.getGateway() != null ? dto.getGateway() : "html5_inicis");
        payment.setPaymentTime(LocalDateTime.now());
        payment.setTotalFee(fee);
        payment.setMemberId(memberId);
        payment.setStatus("결제 완료");

        // 5. 저장 및 로그 연결
        paymentMapper.insertPayment(payment);
        parkingLogMapper.updatePaymentInfoOnly(
                entryId,
                payment.getPaymentId(),
                true,                          // is_paid
                LocalDateTime.now(),           // paid_at
                payment.getPaymentMethod(),
                payment.getTotalFee());
        return true;
    }

    @Override
    public void markAsPaid(Long paymentId) {
        paymentMapper.updatePaidStatus(paymentId, 1);
    }

    @Override
    public boolean requestSubscriptionPayment(Long memberId, String customerUid, Integer amount) {
        return false;
    }

    @Override
    public boolean recordSubscriptionPayment(Long memberId, String customerUid, String merchantUid, String impUid, Integer amount, String paymentType, String carNumber) {
        try {
            Payment payment = new Payment();
            payment.setMemberId(memberId);
            payment.setCustomerUid(customerUid);
            payment.setMerchantUid(merchantUid);
            payment.setImpUid(impUid);
            payment.setTotalFee(amount);
            payment.setPaymentType(paymentType);
            payment.setCarNumber(carNumber);
            payment.setPaymentMethod("CARD"); // 또는 나중에 paymentType 따라 구분 가능
            payment.setPaid(true);
            payment.setPaymentTime(LocalDateTime.now());

            paymentMapper.insertPayment(payment);

            // 정기권일 경우 구독 기간 연장
            if ("정기권".equals(paymentType)) {
                subscriptionService.extendSubscription(memberId);
            }

            return true;
        } catch (Exception e) {
            log.error("정기결제 저장 중 오류", e);
            return false;
        }
    }

    @Transactional
    @Override
    public void payForDailyReservation(DailyReservationPaymentDto dto) {

        // 🔍 예약 유효성 확인
        Reservation reservation = reservationMapper.findByIdAndMemberId(dto.getReservationId(), dto.getMemberId());
        if (reservation == null || !"UNPAID".equals(reservation.getStatus())) {
            throw new IllegalStateException("결제할 수 없는 예약입니다.");
        }

        // 💳 결제 정보 저장
        Payment payment = new Payment();
        payment.setMemberId(dto.getMemberId());
        payment.setReservationId(dto.getReservationId());
        payment.setTotalFee(reservation.getFee());
        payment.setPaymentMethod(dto.getPaymentMethod());
        payment.setGateway(dto.getGateway());
        payment.setPaid(true);
        payment.setStatus("결제 완료");
        payment.setPaymentType("일주차");
        payment.setMerchantUid(dto.getMerchantUid());
        payment.setImpUid(dto.getImpUid());
        payment.setPaymentTime(LocalDateTime.now());
        payment.setCarNumber(reservation.getVehicleNumber());

        paymentMapper.insertPayment(payment);

        // 📌 예약 상태 변경
        reservationMapper.updateStatus(dto.getReservationId(), "PAID");
    }

    @Override
    public void payForMonthlyReservation(MonthlyReservationPaymentDto dto) {
        // 1. 예약 조회 및 검증
        Reservation reservation = reservationMapper.findByIdAndMemberId(dto.getReservationId(), dto.getMemberId());
        if (reservation == null || !reservation.getStatus().equals("UNPAID")) {
            throw new IllegalStateException("유효하지 않은 예약입니다.");
        }

        // 2. 결제 내역 저장
        Payment payment = new Payment();
        payment.setMemberId(dto.getMemberId());
        payment.setReservationId(dto.getReservationId());
        payment.setPaymentMethod(dto.getPaymentMethod());
        payment.setGateway(dto.getGateway());
        payment.setImpUid(dto.getImpUid());
        payment.setMerchantUid(dto.getMerchantUid());
        payment.setTotalFee(dto.getAmount());
        payment.setPaymentType("정기권");
        payment.setPaid(true);
        payment.setStatus("결제 완료");
        payment.setPaymentTime(LocalDateTime.now());
        payment.setCarNumber(reservation.getVehicleNumber());
        paymentMapper.insertPayment(payment);

        // 3. 정기권 등록
        Subscription sub = new Subscription();
        sub.setMemberId(dto.getMemberId());
        sub.setStartDate(reservation.getReservationStart());
        sub.setEndDate(reservation.getReservationEnd());
        sub.setActive(true); // 활성화
        sub.setCustomerUid("user_" + dto.getMemberId()); // or DB에서 조회된 값

        subscriptionMapper.insertSubscription(sub);

        // 4. 예약 상태 변경
        reservationMapper.updateStatus(dto.getReservationId(), "PAID");
        
        //5. 회원 정보 정기권 여부 업데이트
        memberMapper.deleteSubscription(dto.getMemberId(), true);


    }

    @Override
    public void processAdminRefund(Long reservationId, String reason) {
        // 1. 예약 정보 조회 및 상태 확인
        Reservation reservation = reservationMapper.findById(reservationId);
        if (reservation == null || !"PAID".equals(reservation.getStatus())) {
            throw new IllegalStateException("유효하지 않은 예약입니다.");
        }

        // 2. 결제 정보 조회 및 상태 확인
        Payment payment = paymentMapper.findByReservationId(reservationId);
        if (payment == null || !"결제 완료".equals(payment.getStatus())) {
            throw new IllegalStateException("결제 정보가 없습니다.");
        }

        // 3. 환불 금액은 전액 환불로 가정
        int refundAmount = payment.getTotalFee();

        // 4. 아임포트 환불 요청
        boolean success = iamportService.refund(payment.getImpUid(), refundAmount);
        if (!success) {
            throw new IllegalStateException("환불 처리에 실패했습니다.");
        }

        // 5. DB 상태 업데이트
        paymentMapper.markAsCancelled(payment.getPaymentId(), reason, refundAmount);
        reservationMapper.cancelReservation(reservationId, reason, refundAmount);

        // 6. 정기권인 경우 관련 테이블 처리
        if ("SUBSCRIPTION".equalsIgnoreCase(reservation.getType())) {
            subscriptionMapper.deleteByMemberId(reservation.getMemberId());
            memberMapper.updateSubscriptionStatus(reservation.getMemberId(), false);
        }
    }

    @Override
    public PaymentSummaryDto getPaymentSummary() {
        PaymentSummaryDto dto = new PaymentSummaryDto();
        dto.setPaymentTodayRevenue(paymentMapper.getTodayRevenue());
        dto.setPaymentMonthlyRevenue(paymentMapper.getMonthlyRevenue());
        dto.setPaymentPendingRefunds(paymentMapper.countPendingRefunds());
        dto.setPaymentFailedPayments(paymentMapper.countFailedPayments());
        return dto;
    }


    @Override
    public PageDto<AdminPaymentDto> getAdminPaymentList(AdminPaymentHistoryRequestDto req) {
        int page = req.getPage() != null ? req.getPage() : 1;
        int limit = req.getLimit() != null ? req.getLimit() : 10;
        int offset = (page - 1) * limit;

        List<AdminPaymentDto> payments = paymentMapper.selectAdminPayments(req, offset, limit);
        int total = paymentMapper.countAdminPayments(req);

        return new PageDto<>(payments, total, page, limit);
    }


}