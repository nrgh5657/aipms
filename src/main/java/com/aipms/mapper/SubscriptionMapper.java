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

    void cancelSubscription(Long subscriptionId);
    List<Subscription> findAll();

    boolean existsByMemberId(Long memberId);
    
    //결제api이용 구독권 결제
    void insertSubscription(@Param("memberId") Long memberId, @Param("customerUid") String customerUid);
    // ✅ 정기권 갱신 (빌링키 재등록 or 기간 갱신 시 사용)
    void updateSubscription(Subscription subscription);


    String findCustomerUidByMemberId(Long memberId);

    Subscription findActiveByMemberId(Long memberId);

    void updateSubscriptionDates(Map<String, Object> paramMap);

    int countActiveMonthlySubscriptions();

    void deactivateSubscription(Long subscriptionId);
}
