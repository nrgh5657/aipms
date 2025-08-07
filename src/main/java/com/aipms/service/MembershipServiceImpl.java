package com.aipms.service;

import com.aipms.dto.MembershipInfoResponseDto;
import com.aipms.mapper.MembershipMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MembershipServiceImpl implements MembershipService {

    private final MembershipMapper membershipMapper;

    @Override
    public MembershipInfoResponseDto getMembershipInfo(Long memberId) {
        return membershipMapper.findMembershipInfoById(memberId);
    }
}
