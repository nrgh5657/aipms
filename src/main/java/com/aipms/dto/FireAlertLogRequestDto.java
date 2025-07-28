package com.aipms.dto;

import lombok.Data;

@Data
public class FireAlertLogRequestDto {
    private int page;        // 0부터 시작
    private int limit;       // 페이지당 항목 수
    private String label;    // fire / normal / smoke 등
    private String location; // CCTV 위치 (선택 필터)
    private String date;     // 감지 날짜 (yyyy-MM-dd)
}