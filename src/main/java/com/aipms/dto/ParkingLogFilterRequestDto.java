package com.aipms.dto;

import lombok.Data;

@Data
public class ParkingLogFilterRequestDto {
    private int page;
    private int size;
    private String carNumber;
    private String requester;
    private Integer subscription; // 1: 월주차, 0: 일반
}
