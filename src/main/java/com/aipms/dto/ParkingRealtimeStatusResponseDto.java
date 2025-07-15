package com.aipms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ParkingRealtimeStatusResponseDto {
    private String zoneCode;     // A, B, C
    private String zoneName;     // A구역, B구역 등
    private int used;            // 현재 사용 중인 주차 수
    private int total;           // 전체 주차 공간 수
    private int usageRate;       // 사용률 (%)
}
