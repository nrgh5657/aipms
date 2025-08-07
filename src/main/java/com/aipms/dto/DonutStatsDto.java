package com.aipms.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DonutStatsDto {
    private int usageRate;
    private int usedSpaces;
    private int availableSpaces;

    // ✅ 월주차 도넛
    private int monthlyRate;
    private int monthlyMembers;
    private int normalMembers;

    // ✅ 예약 도넛
    private int reservationRate;
    private int reservedToday;
    private int unreservedToday;
}
