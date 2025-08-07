package com.aipms.dto;

import lombok.Data;

@Data
public class CctvLogStatisticsDto {
    private int todayLogs;
    private int normalCount;
    private int errorCount;
    private int fireLogCount;
}
