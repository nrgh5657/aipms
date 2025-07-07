package com.aipms.mapper;

import com.aipms.domain.CctvStatusLogVO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CctvStatusLogMapper {
    void insertCctvLog(CctvStatusLogVO log);
}
