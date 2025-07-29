package com.aipms.mapper;

import com.aipms.domain.Subscription;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Mapper
public interface SubscriptionMapper {
    void insertSubscription(Subscription subscription);
    Subscription findByMemberId(Long memberId);

    List<Subscription> findAll();

    String findCustomerUidByMemberId(Long memberId);

    Subscription findActiveByMemberId(Long memberId);

    void updateSubscriptionDates(Map<String, Object> paramMap);

    int countActiveMonthlySubscriptions();

    void deactivateSubscription(Long subscriptionId);

    void deleteByMemberId(Long memberId);
}
