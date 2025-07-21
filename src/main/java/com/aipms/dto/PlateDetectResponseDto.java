package com.aipms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PlateDetectResponseDto {
    private String plateNumber;
    private String imageBase64;
}
