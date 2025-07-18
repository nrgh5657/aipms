package com.aipms.mapper;

import com.aipms.dto.FireAlertTargetDto;
import org.apache.ibatis.annotations.Mapper;
import com.aipms.domain.Member;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface MemberMapper {
    //회원 등록
    void insertMember(Member member);

    //회원 등록시 멤버코드 추가
    void updateMemberCode(@Param("memberId") Long memberId, @Param("memberCode") String memberCode);
    
    //이메일로 멤버 조회
    Member findByEmail(String email);

    //멤버 코드로 조회
    Member findByMemberCode(String memberCode);

    //이름으로 조회
    Member findByName(String nickname);

    //카카오 아이디로 조회
    Member findByKakaoId(String kakaoId);

    //아이디로 조회
    Member findById(String id);
    
    //차량넘버로 조회
    Member findByCarNumber(String carNumber);
    
    // 모든 멤버 조회
    List<Member> findAll();
    
    //모든 ADMIN 조회 - 화재 감지시 관리자에게 화재 알람
    List<Member> findAdmins();

    //페이징 처리를 적용 멤버 조회
    List<Member> findPagedMembers(int offset, int size);
    
    FireAlertTargetDto findSubscribedMemberByCarNumber(String carNumber);
    
    //카카오 연동을 위한 카카오 아이디 업데이트
    void updateMemberKakaoId(Member member);

    
    //멤버 코드로 삭제
    void deleteByMemberCode(String memberCode);

    
    //해당 멤버 코드 비활성화
    void deactivateMember(@Param("memberCode") String memberCode);
    
    //해당 멤버 코드 활성화
    void activateMember(@Param("memberCode") String memberCode);
    

    
    //멤버 수정
    void update(Member member);

    //페이징 처리를 위한 전체 회원수 조회
    int countAllMembers();

    void updateSubscriptionStatus(@Param("memberId") Long memberId, @Param("status") boolean status);
}
