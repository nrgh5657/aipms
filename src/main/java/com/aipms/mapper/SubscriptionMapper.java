package com.aipms.mapper;

import com.aipms.domain.Subscription;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface SubscriptionMapper {
    void insertSubscription(Subscription subscription);
    Subscription findByMemberId(Long memberId);
    void cancelSubscription(Long subscriptionId);
    List<Subscription> findAll();
}
