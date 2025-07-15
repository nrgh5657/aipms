package com.aipms.dto;

import lombok.Data;

@Data
public class LiveParkingStatusDto {
    private int totalSlots;
    private int occupiedSlots;
    private int availableSlots;
    private int occupancyRate;
}
