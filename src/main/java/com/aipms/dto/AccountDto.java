package com.aipms.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AccountDto {
    private int point;
    private int expireNextMonth;
    private int balance;
    private int monthlyUsage;
    private int compareLastMonth;
    private LocalDateTime lastChargeDate;
}
