package com.aipms.dto;

import lombok.Data;

@Data
public class MemberSummaryDto {
    private int total;       // 전체 회원 수
    private int active;      // 활성 회원 수
    private int monthly;     // 월주차 회원 수
    private int newToday;    // 오늘 신규 가입 수
}
