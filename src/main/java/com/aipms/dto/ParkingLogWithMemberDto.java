package com.aipms.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ParkingLogWithMemberDto {
    private Long id;
    private String carNumber;
    private String parkingType;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private Integer cameraId;
    private LocalDateTime createdAt;
    private String memberName;  // 신청자 이름
}
