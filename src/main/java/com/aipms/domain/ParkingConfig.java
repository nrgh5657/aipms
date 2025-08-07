package com.aipms.domain;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ParkingConfig {
    private Long id;                           // PK
    private int totalSpaces;                   // 전체 주차 공간 수
    private int fixedSubscriptionSpaces;       // 정기권 전용 공간 수
    private LocalDateTime updatedAt;           // 마지막 수정 시간
}
