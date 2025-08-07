package com.aipms.domain;

import lombok.Data;

@Data
public class Parking {
    private Long parkingId;
    private String name;
    private String location;
    private String spaceNo;
    private Boolean isOccupied;
    private String cctvUrl;

    // 🔽 누락된 필드 추가
    private int totalSpace;
    private int occupiedCount;
}
