package com.aipms.domain;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CctvStatusLogVO {
    private Long id;
    private String cameraName;
    private String location;
    private String status;           // ONLINE / OFFLINE 등
    private LocalDateTime lastConnected;
    private String logType;          // REGULAR
    private LocalDateTime createdAt;
}
