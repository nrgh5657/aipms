package com.aipms.domain;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class Car {
    private Long carId;
    private Long memberId;
    private String carNumber;
    private String carType;
    private LocalDateTime regDate;
}
