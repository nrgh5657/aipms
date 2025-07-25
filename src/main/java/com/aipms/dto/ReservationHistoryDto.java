package com.aipms.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReservationHistoryDto {
    private Long id;
    private LocalDateTime reservationStart;
    private LocalDateTime reservationEnd;
    private String carNumber;
    private int fee;
    private String status;
}
