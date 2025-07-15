package com.aipms.dto;

import lombok.Data;


@Data
public class UsageHistoryDto {
    private String date;           // 날짜 (07/02)     // 요일 (화)
    private String slotName;       // A-15번
    private String duration;       // 2시간 30분
    private String startTime;
    private String endTime;   // 09:30 - 12:00
    private String carNumber;      // 차량 번호
    private int fee;               // 결제 금액
    private String status;         // 이용중 / 완료
}