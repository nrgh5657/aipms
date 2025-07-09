package com.aipms.mapper;

import com.aipms.domain.FireLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface FireLogMapper {
    void insertFireLog(FireLog fireLog);
}
