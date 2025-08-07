package com.aipms.domain;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class Subscription {
    private Long subscriptionId;
    private Long memberId;
    private String customerUid;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean active;
}
