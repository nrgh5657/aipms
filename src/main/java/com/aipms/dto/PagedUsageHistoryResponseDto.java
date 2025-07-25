package com.aipms.dto;

import lombok.Data;

import java.util.List;

@Data
public class PagedUsageHistoryResponseDto {
    private List<UsageHistoryResponseDto> history;
    private PageDto<UsageHistoryResponseDto> page;
}
