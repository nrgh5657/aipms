package com.aipms.mapper;

import com.aipms.dto.UsageSummaryDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UsageSummaryMapper {
    UsageSummaryDto getSummaryByMemberId(@Param("memberId") Long memberId);


}
