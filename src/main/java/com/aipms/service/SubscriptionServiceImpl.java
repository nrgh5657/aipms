package com.aipms.service;

import com.aipms.domain.Subscription;
import com.aipms.dto.SubscriptionDto;
import com.aipms.mapper.MemberMapper;
import com.aipms.mapper.SubscriptionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriptionServiceImpl implements SubscriptionService {

    private final SubscriptionMapper subscriptionMapper;
    private final MemberMapper memberMapper;

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
    public void registerSubscription(Long memberId, String customerUid) {
        Subscription current = subscriptionMapper.findActiveByMemberId(memberId);
        LocalDateTime now = LocalDateTime.now();

        LocalDateTime newStart;
        LocalDateTime newEnd;

        if (current != null && current.getEndDate().isAfter(now)) {
            newStart = current.getStartDate();  // 기존 시작일 유지
            newEnd = current.getEndDate().plusMonths(1);  // 종료일만 연장
        } else {
            newStart = now;
            newEnd = now.plusMonths(1);
        }

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
}
