// src/main/java/com/aipms/dto/PaymentHistoryRequestDto.java
package com.aipms.dto;

import lombok.Data;

@Data
public class PaymentHistoryRequestDto {
    private Integer page = 1;
    private Integer limit = 20;
    private String startDate;
    private String endDate;
    private String status;
    private String keyword;


    private Long memberId; // 로그인 사용자 필터용
}
