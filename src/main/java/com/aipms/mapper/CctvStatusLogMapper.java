package com.aipms.mapper;

import com.aipms.domain.CctvStatusLogVO;
import com.aipms.dto.CctvLogDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CctvStatusLogMapper {
    void insertCctvLog(CctvStatusLogVO log);

    Long findParkingIdByCameraId(@Param("cameraId") int cameraId);

    List<CctvLogDto> getLatestLogsPerCctv();

}
