package com.aipms.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class RefundPolicyDto {
    private Long id;
    private int refundTimeLimitMinutes;
    private double penaltyBefore2days;
    private double penaltyBefore1day;
    private double penaltySameOrAfter;
    private LocalDate applyFrom;
    private boolean active;
}
