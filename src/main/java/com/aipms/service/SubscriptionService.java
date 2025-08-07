package com.aipms.service;

import com.aipms.dto.SubscriptionDto;

import java.util.List;

public interface SubscriptionService {
    void applySubscription(SubscriptionDto dto);

    SubscriptionDto getSubscriptionByMember(Long memberId);

    List<SubscriptionDto> getAllSubscriptions();

    String getCustomerUid(Long memberId);

    void extendSubscription(Long memberId);

    boolean isActiveSubscription(Long memberId);

    boolean isMonthlySubscriptionAvailable();

}
