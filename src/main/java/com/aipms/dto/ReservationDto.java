package com.aipms.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReservationDto {
    private Long reservationId;
    private Long memberId;
    private String vehicleNumber;
    private LocalDateTime reservationStart;
    private LocalDateTime reservationEnd;
    private String status;
    private Integer fee;
    private String paymentMethod;
    private String impUid;
    private String merchantUid;
    private String gateway;
}
