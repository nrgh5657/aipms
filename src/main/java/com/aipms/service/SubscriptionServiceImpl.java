package com.aipms.service;

import com.aipms.domain.Payment;
import com.aipms.domain.Subscription;
import com.aipms.dto.ParkingConfigDto;
import com.aipms.dto.SubscriptionDto;
import com.aipms.mapper.MemberMapper;
import com.aipms.mapper.ParkingConfigMapper;
import com.aipms.mapper.PaymentMapper;
import com.aipms.mapper.SubscriptionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriptionServiceImpl implements SubscriptionService {

    private final SubscriptionMapper subscriptionMapper;
    private final MemberMapper memberMapper;
    private final PaymentMapper paymentMapper;
    private final ParkingConfigMapper parkingConfigMapper;
    private final IamportService iamportService;

    @Override
    public void applySubscription(SubscriptionDto dto) {
        Subscription sub = new Subscription();
        sub.setMemberId(dto.getMemberId());
        sub.setStartDate(dto.getStartDate());
        sub.setEndDate(dto.getEndDate());
        sub.setActive(true);
        subscriptionMapper.insertSubscription(sub);
    }

    @Override
    public SubscriptionDto getSubscriptionByMember(Long memberId) {
        Subscription sub = subscriptionMapper.findByMemberId(memberId);
        if (sub == null) return null;
        SubscriptionDto dto = new SubscriptionDto();
        dto.setSubscriptionId(sub.getSubscriptionId());
        dto.setMemberId(sub.getMemberId());
        dto.setStartDate(sub.getStartDate());
        dto.setEndDate(sub.getEndDate());
        dto.setActive(sub.getActive());
        return dto;
    }

    @Override
    public void cancelSubscription(Long subscriptionId) {
        subscriptionMapper.cancelSubscription(subscriptionId);
    }

    @Override
    public List<SubscriptionDto> getAllSubscriptions() {
        return subscriptionMapper.findAll().stream().map(sub -> {
            SubscriptionDto dto = new SubscriptionDto();
            dto.setSubscriptionId(sub.getSubscriptionId());
            dto.setMemberId(sub.getMemberId());
            dto.setStartDate(sub.getStartDate());
            dto.setEndDate(sub.getEndDate());
            dto.setActive(sub.getActive());
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public String getCustomerUid(Long memberId) {
        return subscriptionMapper.findCustomerUidByMemberId(memberId);
    }

    @Override
    public void registerSubscription(Long memberId, String customerUid, String merchantUid,
                                     String impUid, int amount, String carNumber,
                                     String paymentMethod, String gateway, String paymentType) {
        Subscription current = subscriptionMapper.findActiveByMemberId(memberId);
        LocalDateTime now = LocalDateTime.now();

        LocalDateTime newStart;
        LocalDateTime newEnd;

        if (current != null && current.getEndDate().isAfter(now)) {
            newStart = current.getStartDate();  // 기존 시작일 유지
            newEnd = current.getEndDate().plusMonths(1);  // 종료일 연장
        } else {
            newStart = now;
            newEnd = now.plusMonths(1);
        }

        // 1. 정기권 정보 저장
        Subscription sub = new Subscription();
        sub.setMemberId(memberId);
        sub.setCustomerUid(customerUid);
        sub.setActive(true);
        sub.setStartDate(newStart);
        sub.setEndDate(newEnd);

        if (subscriptionMapper.existsByMemberId(memberId)) {
            subscriptionMapper.updateSubscription(sub);
        } else {
            subscriptionMapper.insertSubscription(sub);
        }

        memberMapper.updateSubscriptionStatus(memberId, true);

        // 🔁 subscription_id 확인
        Long subscriptionId = sub.getSubscriptionId(); // 또는 getId(), getId() 이름에 따라

        // ✅ 2. payment 테이블에도 결제 정보 저장
        Payment payment = new Payment();
        payment.setMemberId(memberId);
        payment.setTotalFee(amount);
        payment.setPaymentMethod(paymentMethod);
        payment.setGateway(gateway);
        payment.setPaid(true);
        payment.setStatus("결제 완료");
        payment.setPaymentType(paymentType);
        payment.setMerchantUid(merchantUid);
        payment.setImpUid(impUid);
        payment.setPaymentTime(now);
        payment.setCarNumber(carNumber);

        payment.setSubscriptionId(subscriptionId);

        paymentMapper.insertPayment(payment); // 기존 insert 구문 그대로 사용
    }



    @Override
    public void extendSubscription(Long memberId) {
        Subscription current = subscriptionMapper.findActiveByMemberId(memberId);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime newStart;
        LocalDateTime newEnd;

        if (current == null || current.getEndDate().isBefore(now)) {
            // 정기권 없거나 만료됨 → 새로 시작
            newStart = now;
            newEnd = now.plusMonths(1);
        } else {
            // 유효한 정기권 → 종료일만 연장
            newStart = current.getStartDate(); // 기존 시작일 유지
            newEnd = current.getEndDate().plusMonths(1);
        }

        Map<String, Object> paramMap = new HashMap<>();
        paramMap.put("startDate", newStart);
        paramMap.put("endDate", newEnd);
        paramMap.put("memberId", memberId);

        subscriptionMapper.updateSubscriptionDates(paramMap);
    }

    @Override
    public boolean isActiveSubscription(Long memberId) {
        SubscriptionDto sub = getSubscriptionByMember(memberId);
        if (sub == null) return false;

        LocalDateTime now = LocalDateTime.now();

        // active가 null일 수도 있으니 null 체크 추가
        if (sub.getActive() == null || !sub.getActive()) return false;

        // 시작일과 종료일이 유효한지 체크
        if (sub.getStartDate() == null || sub.getEndDate() == null) return false;

        // 현재 시간이 구독 기간 내에 있는지 확인
        return !now.isBefore(sub.getStartDate()) && !now.isAfter(sub.getEndDate());

    }

    @Override
    public boolean isMonthlySubscriptionAvailable() {
        ParkingConfigDto config = parkingConfigMapper.getConfig();
        int current = subscriptionMapper.countActiveMonthlySubscriptions();
        return current < config.getFixedSubscriptionSpaces();
    }

    @Override
    public void refundSubscription(Long memberId, String reason) {
        Subscription subscription = subscriptionMapper.findActiveByMemberId(memberId);
        if (subscription == null || subscription.getStartDate() == null) {
            throw new IllegalStateException("활성화된 정기권이 없습니다.");
        }

        Payment payment = paymentMapper.findLatestSubscriptionPayment(memberId);
        if (payment == null || !payment.getStatus().equals("결제 완료")) {
            throw new IllegalStateException("결제 정보가 없습니다.");
        }

        // 1시간 이내 전액 환불
        long minutesSincePayment = Duration.between(payment.getPaymentTime(), LocalDateTime.now()).toMinutes();
        int totalFee = payment.getTotalFee();
        int refundAmount;

        if (minutesSincePayment <= 60) {
            refundAmount = totalFee; // 전액 환불
        } else {
            // 당일 환불: 위약금 10% + 사용일수 차감
            LocalDate today = LocalDate.now();
            LocalDate start = subscription.getStartDate().toLocalDate();

            long usedDays = ChronoUnit.DAYS.between(start, today);
            if (usedDays < 0) usedDays = 0;
            if (usedDays >= 30) throw new IllegalStateException("이미 사용 완료된 정기권은 환불할 수 없습니다.");

            int penalty = (int) (totalFee * 0.1); // 10% 위약금
            int dailyRate = totalFee / 30;
            int usageFee = (int) (usedDays * dailyRate);
            refundAmount = Math.max(totalFee - penalty - usageFee, 0);
        }

        // 아임포트 환불 처리
        iamportService.refund(payment.getImpUid(), refundAmount);

        // DB 업데이트
        subscriptionMapper.deactivateSubscription(subscription.getSubscriptionId());
        paymentMapper.markAsCancelled(payment.getPaymentId(), reason, refundAmount);

    }
}
