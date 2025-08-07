package com.aipms.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class FireAlertDto {
    private Long id;

    @JsonProperty("camera_id")
    private String cameraId;       // DB에 없으면 null이어도 문제 없음

    private String label;

    private double confidence;

    @JsonProperty("video_url")
    private String videoUrl;

    @JsonProperty("image_path")
    private String imagePath;

    @JsonProperty("detected_at")
    private String detectedAt;

    private String location;

    private String adminJudgment;

    private String alertStatus;

    @JsonProperty("alert_time")
    private String alertTime;

    private String notes;
}

