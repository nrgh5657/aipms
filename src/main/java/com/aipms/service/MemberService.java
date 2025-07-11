package com.aipms.service;

import com.aipms.domain.Member;
import com.aipms.dto.MemberDto;

import java.util.List;

public interface MemberService {
    void register(MemberDto memberDto);
    Member getMemberByEmail(String email);
    boolean login(String email, String password);
    List<Member> findAllMembers();

}
