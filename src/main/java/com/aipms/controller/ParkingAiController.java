// com.aipms.controller.ParkingAiController.java
package com.aipms.controller;

import com.aipms.dto.PlateDetectResponseDto;
import com.aipms.service.PlateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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
    public ResponseEntity<Map<String, String>> handleUpload(@RequestParam("image") MultipartFile file) throws IOException {
        PlateDetectResponseDto response = plateService.detectPlateFromAI(file);

        Map<String, String> result = new HashMap<>();
        result.put("plateNumber", response.getPlateNumber());
        result.put("image", response.getImageBase64());  // 예: "data:image/jpeg;base64,..."

        return ResponseEntity.ok(result);
    }

}
