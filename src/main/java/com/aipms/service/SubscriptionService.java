package com.aipms.service;

import com.aipms.dto.SubscriptionDto;

import java.util.List;

public interface SubscriptionService {
    void applySubscription(SubscriptionDto dto);
    SubscriptionDto getSubscriptionByMember(Long memberId);
    void cancelSubscription(Long subscriptionId);
    List<SubscriptionDto> getAllSubscriptions();
    String getCustomerUid(Long memberId);

    void registerSubscription(Long memberId, String customerUid);

    void extendSubscription(Long memberId);

    boolean isActiveSubscription(Long memberId);
}
