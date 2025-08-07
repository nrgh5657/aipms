package com.aipms.dto;

import lombok.Data;

@Data
public class OrderRequestDto {
    private String merchantUid;
    private int totalFee;
}
