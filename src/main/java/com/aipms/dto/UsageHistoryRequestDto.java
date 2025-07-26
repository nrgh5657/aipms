package com.aipms.dto;

import lombok.Data;

@Data
public class UsageHistoryRequestDto {
    private Long memberId;
    private int page = 1;
    private int limit = 5;
    private int offset;
    private String startDate;
    private String endDate;

    private String status;   // 추가
    private String keyword;  // 추가
    private String type;

    public int getOffset() {
        return (page - 1) * limit;
    }

}
