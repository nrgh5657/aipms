package com.aipms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeeOverviewDto {
    private Integer timeFee;
    private Integer dailyFee;
    private Integer monthlyFee;
}
