package com.aipms.service;

import com.aipms.dto.FeePolicyDto;
import com.aipms.mapper.FeePolicyMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FeePolicyServiceImpl implements FeePolicyService {
    private final FeePolicyMapper feePolicyMapper;

    @Override
    public List<FeePolicyDto> getAllPolicies() {
        return feePolicyMapper.findAll();
    }

    @Override
    public FeePolicyDto getPolicyById(Long id) {
        return feePolicyMapper.findById(id);
    }

    @Override
    public boolean updatePolicy(FeePolicyDto dto) {
        return feePolicyMapper.updatePolicy(dto) > 0;
    }

    @Override
    public FeePolicyDto getActivePolicyByType(String policyType) {
        return feePolicyMapper.findActivePolicyByType(policyType);
    }
}
