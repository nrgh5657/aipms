package com.aipms.mapper;

import com.aipms.domain.Account;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AccountMapper {

    Account findByMemberId(Long memberId); // @Select 제거
}

