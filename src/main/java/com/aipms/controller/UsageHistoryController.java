package com.aipms.controller;

import com.aipms.dto.UsageHistoryDto;
import com.aipms.dto.UsageSummaryDto;
import com.aipms.service.UsageHistoryService;
import com.aipms.service.UsageSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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

        List<UsageHistoryDto> history = usageHistoryService.getHistory(memberId, startDate, endDate);
        UsageSummaryDto summary = usageSummaryService.getSummary(memberId);

        Map<String, Object> result = new HashMap<>();
        result.put("history", history);
        result.put("summary", summary);
        return result;
    }


}
