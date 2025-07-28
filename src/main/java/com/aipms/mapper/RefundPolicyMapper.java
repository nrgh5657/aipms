package com.aipms.mapper;

import com.aipms.dto.RefundPolicyDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface RefundPolicyMapper {

    // 활성 정책 1건 조회
    RefundPolicyDto findActivePolicy();

    // ID 기준 단건 조회 (수정 시)
    RefundPolicyDto findById(@Param("id") Long id);

    // ID 기준 수정
    int updatePolicy(RefundPolicyDto policy);

    // 이미 active 정책이 존재하는지 확인 (새 정책 생성 시)
    boolean existsActivePolicy();


}
