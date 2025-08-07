package com.aipms.service;

import com.aipms.dto.UsageSummaryDto;
import com.aipms.mapper.UsageSummaryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UsageSummaryServiceImpl implements UsageSummaryService {

    private final UsageSummaryMapper usageSummaryMapper;

    @Override
    public UsageSummaryDto getSummary(Long memberId) {
        return usageSummaryMapper.getSummaryByMemberId(memberId);
    }
}
