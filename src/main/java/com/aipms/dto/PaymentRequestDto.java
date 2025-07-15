package com.aipms.dto;

import lombok.Data;

@Data
public class PaymentRequestDto {
    private Long entryId;
    private String paymentMethod;
    private String gateway;
}