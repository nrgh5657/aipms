package com.aipms.mapper;

import com.aipms.dto.FireAlertTargetDto;
import org.apache.ibatis.annotations.Mapper;
import com.aipms.domain.Member;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface MemberMapper {
    void insertMember(Member member);

    void updateMemberCode(@Param("memberId") Long memberId, @Param("memberCode") String memberCode);

    Member findByEmail(String email);

    List<Member> findAll();


    List<Member> findAdmins();

    FireAlertTargetDto findSubscribedMemberByCarNumber(String carNumber);

    void updateMemberKakaoId(Member member);

    Member findByMemberCode(String memberCode);

    void deleteByMemberCode(String memberCode);

    Member findByName(String nickname);

    Member findByKakaoId(String kakaoId);
}
