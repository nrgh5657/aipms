package com.aipms.dto;

import lombok.Data;

@Data
public class UsageHistoryRequestDto {
    private Long memberId;
    private int page = 1;
    private int limit = 5;
    private String startDate;
    private String endDate;

    public int getOffset() {
        return (page - 1) * limit;
    }

}
