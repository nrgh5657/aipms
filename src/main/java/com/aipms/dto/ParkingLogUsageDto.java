package com.aipms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ParkingLogUsageDto {
    private int entryCount;
    private int exitCount;
    private int currentCount;
}
