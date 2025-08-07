package com.aipms.domain;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EntryLog {
    private Long entryId;
    private Long vehicleId;
    private Long parkingId;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private Boolean aiDetected;
    private Long paymentId;
}
