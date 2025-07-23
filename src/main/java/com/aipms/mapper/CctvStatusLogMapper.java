package com.aipms.mapper;

import com.aipms.domain.CctvStatusLogVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface CctvStatusLogMapper {
    void insertCctvLog(CctvStatusLogVO log);

    Long findParkingIdByCameraId(@Param("cameraId") int cameraId);
}
