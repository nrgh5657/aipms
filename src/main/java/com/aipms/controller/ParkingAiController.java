// com.aipms.controller.ParkingAiController.java
package com.aipms.controller;

import com.aipms.dto.PlateDetectResponseDto;
import com.aipms.service.PlateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Controller
public class ParkingAiController {

    @Autowired
    private PlateService plateService;

    @GetMapping("/fast-payment")
    public String uploadForm() {
        return "fast-payment";
    }

    @PostMapping("/detect")
    @ResponseBody
    public ResponseEntity<Map<String, String>> handleUpload(
            @RequestParam("image") MultipartFile file,
            @RequestParam("cameraId") int cameraId // ✅ cameraId 추가
    ) throws IOException {
        PlateDetectResponseDto response = plateService.detectPlateFromAI(file);
        String plateNumber = response.getPlateNumber();
        String imageUrl = response.getImagePath();

        boolean isMember = plateService.processPlateEntry(plateNumber, cameraId); // ✅ cameraId 전달

        Map<String, String> result = new HashMap<>();
        result.put("plateNumber", plateNumber);
        result.put("image", imageUrl);
        result.put("isMember", Boolean.toString(isMember));
        result.put("entryTime", LocalDateTime.now().toString());

        return ResponseEntity.ok(result);
    }


}
