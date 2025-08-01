package com.aipms.mapper;

import com.aipms.domain.CctvStatusLogVO;
import com.aipms.dto.CctvLogDto;
import com.aipms.dto.CctvLogSearchRequestDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CctvStatusLogMapper {
    void insertCctvLog(CctvStatusLogVO log);

    Long findParkingIdByCameraId(@Param("cameraId") int cameraId);

    List<CctvLogDto> getLatestLogsPerCctv();

    List<CctvStatusLogVO> findAllLogs();

    List<CctvStatusLogVO> findPagedLogs(@Param("dto") CctvLogSearchRequestDto dto,
                                        @Param("offset") int offset,
                                        @Param("limit") int limit);

    int countLogs(@Param("dto") CctvLogSearchRequestDto dto);

    int countTodayLogs();
    int countLogsByStatus(@Param("status") String status);
}
