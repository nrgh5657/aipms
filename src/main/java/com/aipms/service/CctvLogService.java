package com.aipms.service;

import com.aipms.domain.CctvStatusLogVO;
import com.aipms.dto.FireAlertDto;

import java.util.List;

public interface CctvLogService {
    void saveRegularLogs(List<CctvStatusLogVO> logs);

    boolean isFireDetected(String cameraId);

    void saveFireLogAsRegular(FireAlertDto dto);
}
