package com.aipms.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class FireAlertDto {
    private Long id;
    private String cameraId;       // DB에 없으면 null이어도 문제 없음
    private String label;
    private double confidence;
    private String videoUrl;
    private String imagePath;
    private String detectedAt;
    private String location;
    private String adminJudgment;
    private String alertStatus;
    private String alertTime;
    private String notes;
}

