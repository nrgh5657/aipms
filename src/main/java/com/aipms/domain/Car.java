package com.aipms.domain;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class Car {
    private Long carId;
    private Long memberId;        // 회원일 경우 사용
    private String guestToken;    // 비회원일 경우 사용
    private String carNumber;
    private String carType;
    private LocalDateTime regDate;
}
