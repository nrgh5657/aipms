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

        // 추가 필드들
        private String location;           // ex: "1층 주차장"
        private String adminJudgment;      // ex: "화재 확인"
        private String alertStatus;        // ex: "전송 완료"
        private LocalDateTime alertTime;   // 전송 시각
        private String notes;              // 메모
}
