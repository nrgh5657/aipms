package com.aipms.dto;

import lombok.Data;

import java.util.List;

@Data
public class MyPageInfoDto {
    private MemberDto memberInfo;
    private MembershipInfoResponseDto membershipInfo;
    private List<CarDto> carList;
    private NotificationSettingsDto notificationSettings;
}