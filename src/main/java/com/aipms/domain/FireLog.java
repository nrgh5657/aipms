package com.aipms.domain;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class FireLog {

        private Long id;
        private String label;
        private double confidence;
        private String videoUrl;
        private String imagePath;
        private LocalDateTime detectedAt;
        private LocalDateTime createdAt;

}
