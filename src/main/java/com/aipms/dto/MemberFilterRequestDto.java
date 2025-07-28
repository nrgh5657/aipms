package com.aipms.dto;

import lombok.Data;

@Data
public class MemberFilterRequestDto {
    private int page;
    private int size;
    private String status;       // "ACTIVE" or "INACTIVE"
    private String membership;   // "월주차" or "일반"
}
