package com.aipms.dto;

import lombok.Data;

@Data
public class AdminPaymentHistoryRequestDto {
    private Integer page = 1;
    private Integer limit = 10;
    private String startDate;
    private String endDate;
    private String status;       // paid / unpaid / all
    private String keyword;      // 차량번호 또는 결제자 이름
    private String paymentType;  // 월주차 / 일반 (프론트에서 구분 시)

}
