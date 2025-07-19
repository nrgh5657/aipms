package com.aipms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@AllArgsConstructor
public class ExitResponseDto {
    private boolean success;
    private String message;
    private boolean paymentRequired;
    private int extraFee;
}
