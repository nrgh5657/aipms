package com.aipms.service;

import com.aipms.domain.ParkingLog;
import com.aipms.domain.Payment;
import com.aipms.dto.*;
import com.aipms.mapper.ParkingLogMapper;
import com.aipms.mapper.PaymentMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private final PaymentMapper paymentMapper;
    private final ParkingLogMapper parkingLogMapper;
    private final ParkingLogService parkingLogService;
    private final SubscriptionService subscriptionService;

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

        // 3. 요금 계산
        int fee = parkingLogService.calculateFee(parkingLog.getEntryTime());
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