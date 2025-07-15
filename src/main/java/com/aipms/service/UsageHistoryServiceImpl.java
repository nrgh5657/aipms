package com.aipms.service;

import com.aipms.domain.Member;
import com.aipms.dto.UsageHistoryDto;
import com.aipms.mapper.MemberMapper;
import com.aipms.mapper.UsageHistoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UsageHistoryServiceImpl implements UsageHistoryService {

    private final UsageHistoryMapper usageHistoryMapper;
    private final MemberMapper memberMapper;

    @Override
    public List<UsageHistoryDto> getHistory(Long memberId, LocalDate startDate, LocalDate endDate) {
        LocalDateTime from = startDate.atStartOfDay();
        LocalDateTime to = endDate.plusDays(1).atStartOfDay(); // 끝나는 날 포함
        return usageHistoryMapper.getUsageHistory(memberId, from, to);
    }

    @Override
    public Long findMemberIdByKakaoId(String kakaoId) {
        Member member = memberMapper.findByKakaoId(kakaoId);
        if (member == null) throw new IllegalStateException("회원 정보를 찾을 수 없습니다.");
        return member.getMemberId();
    }
}
