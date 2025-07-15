package com.aipms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MembershipInfoResponseDto {

    private String membershipGrade;
    private String joinedAt;
    private int totalUsageCount;
    private int totalPayment;
    private int discountRate;
    private List<String> benefits;
}
