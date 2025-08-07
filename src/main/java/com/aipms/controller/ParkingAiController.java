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
            @RequestParam("cameraId") int cameraId
    ) throws IOException {

        PlateDetectResponseDto response = plateService.detectPlateFromAI(file);
        String plateNumber = response.getPlateNumber();
        String imageUrl = response.getImagePath();

        // 이미지 경로 저장
        plateService.setLastImagePath(imageUrl);

        // DB 처리 및 전체 정보 Map으로 받기
        Map<String, Object> dbResult = plateService.processPlateEntry(plateNumber, cameraId);

        // 응답용 Map 생성
        Map<String, String> result = new HashMap<>();
        result.put("plateNumber", plateNumber);
        result.put("image", imageUrl);
        result.put("isMember", dbResult.get("isMember") != null ? dbResult.get("isMember").toString() : "false");
        result.put("entryTime", dbResult.get("entryTime") != null ? dbResult.get("entryTime").toString() : "");
        result.put("parkingId", dbResult.get("parkingId") != null ? dbResult.get("parkingId").toString() : "-1");

        // ✅ 입차 거부 응답 처리
        if (dbResult.get("entryDenied") != null && dbResult.get("entryDenied").equals(true)) {
            result.put("entryDenied", "true");
            result.put("reason", dbResult.get("reason").toString());
        }

        return ResponseEntity.ok(result);
    }




}
