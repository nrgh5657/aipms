package com.aipms.dto;

import lombok.Data;

@Data
public class DayOfWeekEntryStatDto {
    private int weekday;      // 1(일) ~ 7(토)
    private double averageCount;
}
