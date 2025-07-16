package com.aipms.domain;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ParkingLog {
    private Long id;                 // 로그 ID (PK)
    private String carNumber;       // 차량번호
    private Long memberId;          // 회원 ID (FK)
    private String parkingType;     // 월주차 or 일주차
    private LocalDateTime entryTime; // 입차 시간
    private LocalDateTime exitTime;  // 출차 시간 (nullable)
    private Integer cameraId;       // 감지한 카메라 번호
    private LocalDateTime createdAt; // 로그 생성일
}