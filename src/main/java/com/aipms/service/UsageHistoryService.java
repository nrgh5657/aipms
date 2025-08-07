package com.aipms.service;

import com.aipms.dto.*;

import java.time.LocalDate;
import java.util.List;

public interface UsageHistoryService {
    List<UsageHistoryResponseDto> getHistory(Long memberId, LocalDate startDate, LocalDate endDate);

    Long findMemberIdByKakaoId(String kakaoId);

    List<UsageHistoryResponseDto> getRecentUsageHistory(Long memberId);

    PageDto<UsageHistoryResponseDto> getPagedUsageHistory(UsageHistoryRequestDto req);
}
