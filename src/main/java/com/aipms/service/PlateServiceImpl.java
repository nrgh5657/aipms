// com.aipms.service.impl.PlateServiceImpl.java
package com.aipms.service;

import com.aipms.domain.Car;
import com.aipms.domain.ParkingLog;
import com.aipms.dto.PlateDetectResponseDto;
import com.aipms.mapper.CarMapper;
import com.aipms.mapper.CctvStatusLogMapper;
import com.aipms.mapper.ParkingLogMapper;
import com.aipms.mapper.ParkingMapper;
import com.aipms.service.PlateService;
import com.aipms.util.MultipartInputStreamFileResource;
import lombok.RequiredArgsConstructor;
import org.apache.ibatis.annotations.Param;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.json.JSONObject;

import java.io.IOException;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PlateServiceImpl implements PlateService {


    @Value("${ai.server.url}") // application.yml에는 http://localhost:5001 만 설정되어 있어야 함
    private String aiServerUrl;
    private final CarMapper carMapper;
    private final ParkingLogMapper parkingLogMapper;
    private String lastImagePath;
    private final CctvStatusLogMapper cctvStatusLogMapper;
    private final ParkingMapper parkingMapper;

    @Override
    public PlateDetectResponseDto detectPlateFromAI(MultipartFile file) throws IOException {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("image", new MultipartInputStreamFileResource(
                file.getInputStream(), file.getOriginalFilename(), file.getSize()
        ));

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        String detectUrl = aiServerUrl + "/detect";
        ResponseEntity<String> response = restTemplate.postForEntity(detectUrl, request, String.class);

        if (response.getStatusCode() == HttpStatus.OK) {
            JSONObject json = new JSONObject(response.getBody());

            String plateText = json.optString("plateNumber", "UNKNOWN");
            String imageUrl = json.optString("image", "");

            // 이미지 경로 저장
            this.lastImagePath = imageUrl;

            return new PlateDetectResponseDto(plateText, imageUrl);
        } else {
            throw new IOException("AI 서버로부터 인식 결과를 받지 못했습니다.");
        }
    }

    @Override
    public boolean processPlateEntry(String carNumber, int cameraId) {
        Car existingCar = carMapper.findByCarNumber(carNumber);
        Long memberId = (existingCar != null) ? existingCar.getMemberId() : null;

        Car car = new Car();
        car.setCarNumber(carNumber);
        car.setCarType("세단");
        car.setRegDate(LocalDateTime.now());

        String guestToken = null;

        if (memberId != null) {
            car.setMemberId(memberId);
            carMapper.insertCar(car);
        } else {
            guestToken = "guest-" + System.currentTimeMillis();
            car.setGuestToken(guestToken);
            carMapper.insertCarForGuest(car);
        }

        ParkingLog log = new ParkingLog();
        log.setCarNumber(carNumber);
        log.setEntryTime(LocalDateTime.now());
        log.setCreatedAt(LocalDateTime.now());
        log.setCameraId(cameraId);
        log.setIsPaid(false);
        log.setParkingType("일일");
        log.setImagePath(lastImagePath);
        if (memberId != null) log.setMemberId(memberId);
        parkingLogMapper.insertLog(log);

        // ✅ occupied_count 증가 로직
        Long parkingId = cctvStatusLogMapper.findParkingIdByCameraId(cameraId);
        if (parkingId != null) {
            parkingMapper.increaseOccupiedCount(parkingId); // ← 여기만 정확히 호출
        }

        return memberId != null;
    }




}
