package com.aipms.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class FireAlertDto {
    private String label;
    private double confidence;

    @JsonProperty("video_url")
    private String videoUrl;

    @JsonProperty("image_path")
    private String imagePath;

    private String cameraId;
}
