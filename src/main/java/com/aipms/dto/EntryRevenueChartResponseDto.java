package com.aipms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.util.List;

@Data
@RequiredArgsConstructor
@AllArgsConstructor
public class EntryRevenueChartResponseDto {
    private List<String> labels;            // ex. "1시", "2시" or "8/1", "8/2" or "1월", "2월" or "1주차"
    private List<Integer> entryCountsNormal;
    private List<Integer> entryCountsDaily;
    private List<Integer> entryCountsMonthly;
    private List<Integer> revenues;
}
