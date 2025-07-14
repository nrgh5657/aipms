package com.aipms.domain;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class Member {
    private Long memberId;
    private String memberCode;
    private String email;
    private String password;
    private String name;
    private String phone;
    private String role; // USER or ADMIN
    private String carNumber;
    private String carModel;
    private Boolean agreeToMarketing;
    private Boolean agreeToTerms;
    private Boolean agreeToPrivacy;
    private Boolean subscription;
    private String status;
    private String kakaoId;
    private String loginType; // ENUM: NORMAL, KAKAO 등
    private LocalDateTime regDate;

}
