package com.aipms.dto;

import lombok.Data;

@Data
public class ReservationHistoryRequestDto {

    private Long memberId;
    private int page = 1;
    private int limit = 10;
    private String startDate;
    private String endDate;
    private String status;
    private String keyword;

    public int getOffset() {
        return (page - 1) * limit;
    }
}
