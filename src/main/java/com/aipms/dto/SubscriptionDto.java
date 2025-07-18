package com.aipms.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SubscriptionDto {
    private Long subscriptionId;
    private Long memberId;
    private String customerUid;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean active;
}
