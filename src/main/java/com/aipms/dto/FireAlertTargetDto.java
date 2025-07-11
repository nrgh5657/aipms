package com.aipms.dto;

import lombok.Data;

@Data
public class FireAlertTargetDto {
    private String carNumber;
    private String name;
    private String phone;
    private String kakaoId;
    private Boolean subscription; // 월주차 여부
    private boolean inParking;    // 임시 하드코딩 값
}

