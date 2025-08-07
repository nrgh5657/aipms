// com.aipms.service.PlateService.java
package com.aipms.service;

import com.aipms.dto.PlateDetectResponseDto;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

public interface PlateService {
    PlateDetectResponseDto detectPlateFromAI(MultipartFile file) throws IOException;

    Map<String, Object> processPlateEntry(String carNumber, int cameraId);

    void setLastImagePath(String imagePath);  // 🔥 추가
    String getLastImagePath();               // 🔥 추가
}

