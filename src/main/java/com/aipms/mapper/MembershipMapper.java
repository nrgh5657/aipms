package com.aipms.mapper;

import com.aipms.dto.MembershipInfoResponseDto;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MembershipMapper {
    MembershipInfoResponseDto findMembershipInfoById(Long memberId);
}
