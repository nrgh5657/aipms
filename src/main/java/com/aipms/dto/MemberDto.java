package com.aipms.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MemberDto {
    private String email;
    private String password;
    private String name;
    private String phone;
    private String carNumber; // 차량 번호 (선택)
    private String carModel;
    private boolean agreeToMarketing; // 마케팅 수신 동의 여부
    private boolean agreeToTerms;     // 서비스 약관 동의 여부 (필수)
    private boolean agreeToPrivacy;   // 개인정보 수집 동의 여부 (필수)
    private boolean subscription; // false 기본
    private String role;
    private String status;        // 기본 "ACTIVE"
    private String kakaoId;       // null
    private String loginType;     // "NORMAL", "KAKAO"
    private LocalDateTime regDate;

}
