package com.aipms.dto;

import lombok.Data;

@Data
public class UsageSummaryDto {
    private int totalCount;      // 총 이용 횟수
    private int totalTime;       // 총 이용 시간 (시간 단위)
    private int totalPaid;   // 총 결제 금액 (원)
    private double averageTime;  // 평균 이용 시간 (시간 단위, 소수점 1자리)
}
