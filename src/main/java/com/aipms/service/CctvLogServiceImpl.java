package com.aipms.service;

import com.aipms.domain.CctvStatusLogVO;
import com.aipms.mapper.CctvStatusLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CctvLogServiceImpl implements CctvLogService {
    private final CctvStatusLogMapper cctvStatusLogMapper;

    @Override
    public void saveRegularLogs(List<CctvStatusLogVO> logs) {
        for (CctvStatusLogVO log : logs) {
            log.setLogType("REGULAR"); // 정기 로그임을 명시
            cctvStatusLogMapper.insertCctvLog(log);
        }
    }

}
