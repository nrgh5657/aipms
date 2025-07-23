package com.aipms.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ParkingLogWithMemberDto {
    private Long id;
    private String carNumber;
    private Long memberId;
    private Integer subscription;  // 추가해야 함
    private String parkingType;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private Integer cameraId;
    private LocalDateTime createdAt;
    private String memberName;  // 신청자 이름

    // 💡 실시간 계산용 필드
    private Long durationMinutes;      // 경과시간 (분 단위)
    private Integer estimatedFee;      // 실시간 요금
}
