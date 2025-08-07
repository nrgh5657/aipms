package com.aipms.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PlateDetectResponseDto {
    private String plateNumber;

    @JsonProperty("image")
    private String imagePath;

    private boolean member;  // 🔥 member 여부를 Flask에서 받는 경우
}
