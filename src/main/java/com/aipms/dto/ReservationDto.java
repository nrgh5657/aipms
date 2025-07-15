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
}
