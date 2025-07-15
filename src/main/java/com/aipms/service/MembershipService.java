package com.aipms.service;

import com.aipms.dto.MembershipInfoResponseDto;

public interface MembershipService {
    MembershipInfoResponseDto getMembershipInfo(Long memberId);
}
