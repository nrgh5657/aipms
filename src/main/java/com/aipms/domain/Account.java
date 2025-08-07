package com.aipms.domain;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class Account {
    private Long id;
    private Long memberId;
    private int point;
    private int pointExpireNextMonth;
    private int prepaidBalance;
    private int monthlyUsage;
    private int compareLastMonth;
    private LocalDateTime lastChargedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
