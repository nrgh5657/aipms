package com.aipms.domain;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class KakaoToken {
    private Long tokenId;
    private String kakaoId;        // "4345559909"
    private String nickname;
    private String accessToken;
    private String refreshToken;
    private LocalDateTime issuedAt;
    private LocalDateTime expiresAt;
    private String uuid;
}

