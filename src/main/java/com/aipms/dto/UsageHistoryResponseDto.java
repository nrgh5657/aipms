package com.aipms.dto;

import lombok.Data;



@Data
public class UsageHistoryResponseDto {
    private String date;        // MM/dd
    private String duration;
    private String startTime;
    private String endTime;
    private String carNumber;
    private int fee;
    private String status;
}