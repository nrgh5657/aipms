package com.aipms.mapper;

import com.aipms.dto.FireAlertTargetDto;
import org.apache.ibatis.annotations.Mapper;
import com.aipms.domain.Member;

import java.util.List;

@Mapper
public interface MemberMapper {
    void insertMember(Member member);
    Member findByEmail(String email);
    List<Member> findAll();

    FireAlertTargetDto findSubscribedMemberByCarNumber(String carNumber);

}
