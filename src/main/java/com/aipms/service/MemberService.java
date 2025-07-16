package com.aipms.service;

import com.aipms.domain.Member;
import com.aipms.dto.MemberDto;
import org.apache.ibatis.annotations.Param;

import java.util.List;


public interface MemberService {
    
    //회원 등록
    void register(MemberDto memberDto);
    
    //멤버코드 업데이트
    void updateMemberCode(@Param("memberId") Long memberId, @Param("memberCode") String memberCode);
    
    //이메일로 회원 조회
    Member getMemberByEmail(String email);
    
    //로그인 확인
    boolean login(String email, String password);
    
    //전체 회원 조회
    List<Member> findAllMembers();
    
    //멤버 코드로 회원 삭제  
    void deleteByMemberCode(String memberCode);
    
    //멤버 코드로 회원 비활성화
    void deactivateMember(String memberCode);
    
    //멤버 코드로 회원 활성화
    void activateMember(String memberCode);
    
    //멤버 수정
    void updateMember(String id, MemberDto dto);
    
    //페이징 처리 적용 멤버 조회
    List<Member> findPagedMembers(int offset, int size);

    //전체 회원수 카운트
    int countAllMembers();
}
