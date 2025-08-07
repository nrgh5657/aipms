package com.aipms.service;

import com.aipms.dto.AccountDto;

public interface AccountService {

    /**
     * 회원 ID로 계정 정보(AccountDto)를 조회합니다.
     * @param memberId 회원 ID
     * @return AccountDto
     */
    AccountDto getAccountByMemberId(Long memberId);
}
