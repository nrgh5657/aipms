package com.aipms.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PlateSearchResponseDto {
    private String plateNumber;
    private String entryTime;      // ISO 8601 형식 문자열
    private String imagePath;      // 저장된 이미지 경로
    private boolean isMember;      // 회원 여부
    private double discountRate;   // 할인율 (0.2 → 20%)
}
