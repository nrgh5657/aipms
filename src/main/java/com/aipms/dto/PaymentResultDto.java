package com.aipms.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PaymentResultDto {
    private Long paymentId;
    private Integer totalFee;
    private boolean paid;
    private LocalDateTime paymentTime;
}