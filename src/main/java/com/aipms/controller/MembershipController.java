package com.aipms.controller;

import com.aipms.dto.MembershipInfoResponseDto;
import com.aipms.security.CustomUserDetails;
import com.aipms.service.MembershipService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/membership")
@RequiredArgsConstructor
public class MembershipController {

    private final MembershipService membershipService;

    @GetMapping("/info")
    public MembershipInfoResponseDto getMembershipInfo(@AuthenticationPrincipal CustomUserDetails user) {
        Long memberId = user.getMemberId();          // 세션에 저장된 회원 PK
        return membershipService.getMembershipInfo(memberId);
    }
}
