package com.aipms.service;

import com.aipms.domain.Member;
import com.aipms.dto.MemberDto;
import org.apache.ibatis.annotations.Param;

import java.util.List;


public interface MemberService {
    void register(MemberDto memberDto);
    void updateMemberCode(@Param("memberId") Long memberId, @Param("memberCode") String memberCode);
    Member getMemberByEmail(String email);
    boolean login(String email, String password);
    List<Member> findAllMembers();

    void deleteByMemberCode(String memberCode);
}
