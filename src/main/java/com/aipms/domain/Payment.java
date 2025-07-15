package com.aipms.domain;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class Payment {
    private Long paymentId;
    private Long entryId;
    private Integer totalFee;
    private String paymentMethod; // 예: CARD, KAKAOPAY
    private String gateway;       // 예: TOSS, NICE
    private boolean paid;
    private boolean cancelled;
    private LocalDateTime paymentTime;
}