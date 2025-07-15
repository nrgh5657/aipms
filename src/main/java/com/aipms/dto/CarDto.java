package com.aipms.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CarDto {
    private Long carId;
    private Long memberId;
    private String carNumber;
    private String carType;
    private LocalDateTime regDate;
}
