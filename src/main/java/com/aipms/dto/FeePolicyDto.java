package com.aipms.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class FeePolicyDto {
    private Long id;
    private String policyType; // 시간제, 일일제, 월정기권 등
    private String name;
    private int baseFee;
    private int unitTime; // 시간제 단위 시간 (ex: 10분)
    private Integer maxFee; // null 가능
    private Double discountRate; // 월정기권에만 사용
    private LocalDate applyFrom;
    private boolean active;
}
