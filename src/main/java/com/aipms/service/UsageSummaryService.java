package com.aipms.service;

import com.aipms.dto.UsageSummaryDto;

public interface UsageSummaryService {
    UsageSummaryDto getSummary(Long memberId);
}
