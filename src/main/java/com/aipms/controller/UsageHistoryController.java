package com.aipms.controller;

import com.aipms.dto.*;
import com.aipms.security.CustomUserDetails;
import com.aipms.service.UsageHistoryService;
import com.aipms.service.UsageSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usage")
@RequiredArgsConstructor
public class UsageHistoryController {

    private final UsageHistoryService usageHistoryService;
    private final UsageSummaryService usageSummaryService;

    @GetMapping("/history")
    public Map<String, Object> getUsageHistoryAndSummary(
            @AuthenticationPrincipal Object principal,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate
    ) {
        Long memberId;

        if (principal instanceof com.aipms.security.CustomUserDetails user) {
            memberId = user.getMember().getMemberId();
        } else if (principal instanceof org.springframework.security.oauth2.core.user.OAuth2User oauthUser) {
            // 카카오 로그인 사용자의 kakaoId 추출
            String kakaoId = oauthUser.getAttribute("id").toString();
            memberId = usageHistoryService.findMemberIdByKakaoId(kakaoId); // 👉 이 메서드를 서비스에 구현
        } else {
            throw new IllegalStateException("인증된 사용자가 아닙니다.");
        }

        if (startDate == null) startDate = LocalDate.of(2000, 1, 1);
        if (endDate == null) endDate = LocalDate.now();

        List<UsageHistoryResponseDto> history = usageHistoryService.getHistory(memberId, startDate, endDate);
        UsageSummaryDto summary = usageSummaryService.getSummary(memberId);

        Map<String, Object> result = new HashMap<>();
        result.put("history", history);
        result.put("summary", summary);
        return result;
    }

    @GetMapping("/recent")
    public ResponseEntity<List<UsageHistoryResponseDto>> getRecentUsageHistory(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        Long memberId = user.getMember().getMemberId();
        List<UsageHistoryResponseDto> history = usageHistoryService.getRecentUsageHistory(memberId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/history/paged")
    public ResponseEntity<PageDto<UsageHistoryResponseDto>> getPagedUsageHistory(
            @AuthenticationPrincipal Object principal,
            @ModelAttribute UsageHistoryRequestDto req // ✅ 필터 DTO 자동 바인딩
    ) {
        Long memberId;

        if (principal instanceof CustomUserDetails user) {
            req.setMemberId(user.getMember().getMemberId());
        } else if (principal instanceof OAuth2User oauthUser) {
            String kakaoId = oauthUser.getAttribute("id").toString();
            req.setMemberId(usageHistoryService.findMemberIdByKakaoId(kakaoId));
        } else {
            throw new IllegalStateException("인증된 사용자가 아닙니다.");
        }

        PageDto<UsageHistoryResponseDto> result = usageHistoryService.getPagedUsageHistory(req);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/summary")
    public UsageSummaryDto getSummary(@AuthenticationPrincipal Object principal) {
        Long memberId;

        if (principal instanceof CustomUserDetails user) {
            memberId = user.getMember().getMemberId();
        } else if (principal instanceof org.springframework.security.oauth2.core.user.OAuth2User oauthUser) {
            String kakaoId = oauthUser.getAttribute("id").toString();
            // TODO: 카카오 ID로 memberId 조회하는 서비스 메서드 구현 필요 시 여기에 넣기
            throw new IllegalStateException("카카오 회원 지원 미구현");
        } else {
            throw new IllegalStateException("인증된 사용자가 아닙니다.");
        }

        return usageSummaryService.getSummary(memberId);
    }


}
