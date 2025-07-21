package com.aipms.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminPaymentDto {
    private Long id;
    private String carNumber;         // parking_log.car_number
    private String payer;             // member.name
    private String paymentType;       // 월주차 or 일반 (추정, subscription_id 없으므로 그냥 '일반'으로)
    private Integer amount;
    private String paymentMethod;
    private LocalDateTime paidAt;
    private String status;
}
