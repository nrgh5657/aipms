package com.aipms.dto;

import lombok.Data;

@Data
public class ReservationRefundRequestDto {
    private Long reservationId;
    private String reason;
}
