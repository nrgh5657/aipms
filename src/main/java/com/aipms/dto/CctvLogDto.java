package com.aipms.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CctvLogDto {
    private String cameraName;        // CCTV 이름
    private String location;          // 설치 위치
    private String status;            // 상태 (예: "스트리밍 정상", "스트리밍 오류")
    private LocalDateTime lastCheckedAt; // 마지막 점검 시간
}
