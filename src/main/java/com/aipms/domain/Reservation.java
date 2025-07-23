package com.aipms.domain;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class Reservation {
    private Long reservationId;
    private Long memberId;
    private String vehicleNumber;
    private LocalDateTime reservationStart;
    private LocalDateTime reservationEnd;
    private String status; // WAITING, APPROVED, CANCELLED
    private Integer fee;
}
