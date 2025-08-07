package com.aipms.domain;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CctvStatusLogVO {
    private Long id;
    private String cameraName;
    private String location;
    private String status;
    private LocalDateTime lastCheckedAt;
    private LocalDateTime lastConnected;
    private String recordStatus;
    private String logType;
    private LocalDateTime createdAt;
}