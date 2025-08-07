package com.aipms.service;

import com.aipms.dto.MemberDto;
import com.aipms.dto.MyPageInfoDto;

public interface MyPageInfoService {
    MyPageInfoDto getMyPageInfo(Long memberId);
    void updateMemberInfo(Long memberId, MemberDto dto);
}
