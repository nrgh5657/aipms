package com.aipms.service;

import com.aipms.dto.FeePolicyDto;

import java.util.List;

public interface FeePolicyService {
    List<FeePolicyDto> getAllPolicies();
    FeePolicyDto getPolicyById(Long id);
    boolean updatePolicy(FeePolicyDto dto);

    FeePolicyDto getActivePolicyByType(String 시간제);
}
