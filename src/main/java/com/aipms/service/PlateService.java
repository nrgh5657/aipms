// com.aipms.service.PlateService.java
package com.aipms.service;

import com.aipms.dto.PlateDetectResponseDto;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface PlateService {
    PlateDetectResponseDto detectPlateFromAI(MultipartFile file) throws IOException;

    // ✅ cameraId를 추가
    boolean processPlateEntry(String carNumber, int cameraId);

}
