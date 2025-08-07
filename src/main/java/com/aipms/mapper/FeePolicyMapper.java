package com.aipms.mapper;

import com.aipms.dto.FeePolicyDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FeePolicyMapper {
    FeePolicyDto findById(@Param("id") Long id);

    List<FeePolicyDto> findAll();

    int updatePolicy(FeePolicyDto dto);

    FeePolicyDto findActivePolicyByType(String policyType);

    Integer selectBaseFeeByType(String time);
}
