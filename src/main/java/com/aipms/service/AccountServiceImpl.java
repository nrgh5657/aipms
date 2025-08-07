package com.aipms.service;

import com.aipms.domain.Account;
import com.aipms.dto.AccountDto;
import com.aipms.mapper.AccountMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {

    private final AccountMapper accountMapper;

    @Override
    public AccountDto getAccountByMemberId(Long memberId) {
        Account account = accountMapper.findByMemberId(memberId);
        if (account == null) return null;

        AccountDto dto = new AccountDto();
        dto.setPoint(account.getPoint());
        dto.setExpireNextMonth(account.getPointExpireNextMonth());
        dto.setBalance(account.getPrepaidBalance());
        dto.setMonthlyUsage(account.getMonthlyUsage());
        dto.setCompareLastMonth(account.getCompareLastMonth());
        dto.setLastChargeDate(account.getLastChargedAt());
        return dto;
    }
}
