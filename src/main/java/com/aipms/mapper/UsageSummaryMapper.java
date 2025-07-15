package com.aipms.mapper;

import com.aipms.dto.UsageSummaryDto;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UsageSummaryMapper {
    UsageSummaryDto getSummary(Long memberId);
}
