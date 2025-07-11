package com.aipms.mapper;

import org.apache.ibatis.annotations.Mapper;
import com.aipms.domain.Member;

@Mapper
public interface MemberMapper {
    void insertMember(Member member);
    Member findByEmail(String email);
}
