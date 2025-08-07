package com.aipms.dto;

import lombok.Data;

@Data
public class UsageSummaryDto {
    private int totalCount;
    private int totalMinutes;         // ✅ 이름 수정
    private int totalPaid;
    private double averageMinutes;    // ✅ 이름 수정
}
