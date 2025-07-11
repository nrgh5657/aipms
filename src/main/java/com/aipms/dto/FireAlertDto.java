package com.aipms.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class FireAlertDto {
    private Long id;                        // DB 저장 시 자동 증가값

    @JsonProperty("camera_id")
    private String cameraId;

    private String label; // "fire", "smoke"

    private double confidence;              // 0.87

    @JsonProperty("video_url")
    private String videoUrl;

    @JsonProperty("image_path")
    private String imagePath;

    @JsonProperty("detected_at")
    private String detectedAt;              // "2025-07-10 14:32" ← String 또는 LocalDateTime

    private String location;                // cameraId로 변환된 위치

    @JsonProperty("admin_judgment")
    private String adminJudgment;           // ex: "화재 확인"

    @JsonProperty("alert_status")
    private String alertStatus;             // ex: "전송 완료"

    @JsonProperty("alert_time")
    private String alertTime;               // 알림 시간

    private String notes;                   // 관리자 비고
}

