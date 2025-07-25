package com.aipms.mapper;

import com.aipms.dto.UsageHistoryDto;
import com.aipms.dto.UsageHistoryRequestDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface UsageHistoryMapper {
    List<UsageHistoryDto> getUsageHistory(
            @Param("memberId") Long memberId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    List<UsageHistoryDto> selectRecentUsageHistoryByMemberId(Long memberId);

    List<UsageHistoryDto> getPagedUsageHistory(UsageHistoryRequestDto req);

    int countUsageHistory(UsageHistoryRequestDto req);
}
