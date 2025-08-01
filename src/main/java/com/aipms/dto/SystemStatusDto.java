package com.aipms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SystemStatusDto {
    private String statusMessage;  // 예: "모든 시스템 정상"
    private int cpuUsage;          // %
    private int memoryUsage;       // %
    private int diskUsage;         // %
}
