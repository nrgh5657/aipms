package com.aipms.dto;

import lombok.Data;

@Data
public class ParkingDto {
    private Long parkingId;
    private String name;
    private String location;
    private String spaceNo;
    private Boolean isOccupied;
    private String cctvUrl;
}
