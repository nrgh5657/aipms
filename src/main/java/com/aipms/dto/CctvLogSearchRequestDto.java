package com.aipms.dto;

import lombok.Data;

@Data
public class CctvLogSearchRequestDto {
    private int page = 1;
    private int size = 10;

    private String status;       // "정상", "스트리밍 오류", "화재 감지됨" 등
    private String logType;      // "REGULAR", "ERROR", "FIRE"
    private String cameraName;   // "지하 1층 주차장" 등
    private String keyword;      // 메시지/위치 검색용 (선택)

}
