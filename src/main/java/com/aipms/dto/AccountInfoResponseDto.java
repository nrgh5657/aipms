package com.aipms.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class AccountInfoResponseDto {
    private int point;
    private int pointExpireNextMonth;
    private int prepaidBalance;
    private LocalDate lastChargedAt;
    private int monthlyUsage;
    private int compareLastMonth;
}
