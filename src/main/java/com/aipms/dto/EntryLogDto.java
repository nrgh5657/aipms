package com.aipms.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EntryLogDto {
    private Long vehicleId;
    private Long parkingId;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private Boolean aiDetected;
    private Long paymentId;
}
