package com.aipms.service;

import com.aipms.dto.RefundPolicyDto;
import com.aipms.mapper.RefundPolicyMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RefundPolicyServiceImpl implements RefundPolicyService {
    private final RefundPolicyMapper refundPolicyMapper;

    @Override
    public RefundPolicyDto getActivePolicy() {
        return refundPolicyMapper.findActivePolicy();
    }

    @Override
    public RefundPolicyDto getPolicyById(Long id) {
        return refundPolicyMapper.findById(id);
    }

    @Override
    public void updatePolicy(RefundPolicyDto policyDto) {
        refundPolicyMapper.updatePolicy(policyDto);
    }

}
