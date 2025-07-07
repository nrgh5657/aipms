package com.aipms.service;

import com.aipms.domain.CctvStatusLogVO;

import java.util.List;

public interface CctvLogService {
    void saveRegularLogs(List<CctvStatusLogVO> logs);
}
