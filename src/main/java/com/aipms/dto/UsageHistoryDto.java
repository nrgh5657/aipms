package com.aipms.dto;

import lombok.Data;

import java.time.LocalDateTime;


@Data
public class UsageHistoryDto {
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private String carNumber;
    private int fee;
}