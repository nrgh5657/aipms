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
}
