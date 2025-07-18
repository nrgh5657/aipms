package com.aipms.service;

import com.aipms.domain.Subscription;
import com.aipms.dto.SubscriptionDto;
import com.aipms.mapper.SubscriptionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriptionServiceImpl implements SubscriptionService {

    private final SubscriptionMapper subscriptionMapper;

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
    public void registerSubscription(Long memberId, String customerUid) {
        Subscription sub = new Subscription();
        sub.setMemberId(memberId);
        sub.setCustomerUid(customerUid);
        sub.setActive(true); // 기본값

        if (subscriptionMapper.existsByMemberId(memberId)) {
            subscriptionMapper.updateSubscription(sub);
        } else {
            subscriptionMapper.insertSubscription(sub);
        }
    }


}
