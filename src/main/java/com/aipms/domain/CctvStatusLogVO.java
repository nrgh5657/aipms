package com.aipms.domain;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CctvStatusLogVO {
    private Long id;
    private String cameraName;
    private String location;
    private String status;         // ONLINE, OFFLINE, CHECKING
    private LocalDateTime lastCheckedAt;
    private LocalDateTime lastConnected;
    private String recordStatus;   // RECORDING, NOT_RECORDING
    private String logType;        // REGULAR, STARTUP, SHUTDOWN
    private LocalDateTime createdAt;
}