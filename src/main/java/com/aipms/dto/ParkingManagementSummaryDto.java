package com.aipms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ParkingManagementSummaryDto {
    private int entryCount;
    private long revenue;
}
