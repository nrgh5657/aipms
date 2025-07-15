package com.aipms.controller;

import com.aipms.dto.AccountInfoResponseDto;
import com.aipms.dto.PaymentRequestDto;
import com.aipms.dto.PaymentResultDto;
import com.aipms.security.CustomUserDetails;
import com.aipms.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/request")
    public PaymentResultDto requestPayment(@RequestBody PaymentRequestDto requestDto) {
        return paymentService.processPayment(requestDto);
    }
    @GetMapping("/account-info")
    public AccountInfoResponseDto getAccountInfo(@AuthenticationPrincipal CustomUserDetails user) {
        Long memberId = user.getMember().getMemberId(); // 로그인된 사용자 정보
        return paymentService.getAccountInfo(memberId);
    }

    private Long extractMemberIdFromToken(String token) {
        // TODO: JWT 토큰 파싱 구현
        return 1L; // 예시
    }
}