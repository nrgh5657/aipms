package com.aipms.dto;

import lombok.Data;

@Data
public class PaymentRefundRequestDto {
    private Long reservationId;
    private String reason;

}
