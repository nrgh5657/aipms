package com.aipms.service;

import com.aipms.dto.UsageHistoryDto;

import java.time.LocalDate;
import java.util.List;

public interface UsageHistoryService {
    List<UsageHistoryDto> getHistory(Long memberId, LocalDate startDate, LocalDate endDate);

    Long findMemberIdByKakaoId(String kakaoId);
}
