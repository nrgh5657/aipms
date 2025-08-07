package com.aipms.mapper;

import com.aipms.dto.OrderRequestDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface OrderMapper {
    Integer findAmountByMerchantUid(@Param("merchantUid") String merchantUid);
    void insertOrder(OrderRequestDto dto);
}
