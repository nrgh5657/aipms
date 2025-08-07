package com.aipms.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ParkingStatusDto {
    private Long id;
    private String name;
    private int total;
    private int occupied;
    private double rate;
    private String carNumber;
    private LocalDateTime entryTime;
    private Long durationMinutes;
    private Integer estimatedFee;
}
