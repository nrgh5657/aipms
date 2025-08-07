// com.aipms.service.impl.PlateServiceImpl.java
package com.aipms.service;

import com.aipms.domain.Car;
import com.aipms.domain.Parking;
import com.aipms.domain.ParkingConfig;
import com.aipms.domain.ParkingLog;
import com.aipms.dto.ParkingConfigDto;
import com.aipms.dto.PlateDetectResponseDto;
import com.aipms.mapper.*;
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
import java.util.HashMap;
import java.util.Map;

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
    private final SubscriptionService subscriptionService;
    private final ParkingConfigMapper parkingConfigMapper;
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

            return new PlateDetectResponseDto(plateText, imageUrl, false); // false: 기본값

        } else {
            throw new IOException("AI 서버로부터 인식 결과를 받지 못했습니다.");
        }
    }

    @Override
    public Map<String, Object> processPlateEntry(String carNumber, int cameraId) {
        carNumber = carNumber.replaceAll("\\s+", ""); // 공백 제거
        System.out.println("🚘 차량번호: " + carNumber);

        // [0] 기존 차량 및 회원 여부
        Car existingCar = carMapper.findByCarNumber(carNumber);
        Long memberId = (existingCar != null) ? existingCar.getMemberId() : null;
        System.out.println("👤 회원 여부: " + (memberId != null));

        // [1] 설정값 로드
        ParkingConfigDto parkingConfig = parkingConfigMapper.getConfig();
        System.out.println("🔧 전체 공간: " + parkingConfig.getTotalSpaces() +
                " | 정기권 공간: " + parkingConfig.getFixedSubscriptionSpaces());

        // [2] 주차장 정보
        Long parkingId = cctvStatusLogMapper.findParkingIdByCameraId(cameraId);
        Parking parking = (parkingId != null) ? parkingMapper.selectById(parkingId) : null;

        if (parking == null) {
            System.out.println("❌ 주차장 정보 없음 (cameraId=" + cameraId + ")");
            throw new RuntimeException("주차장 정보가 존재하지 않습니다.");
        }

        int total = parking.getTotalSpace();
        int occupied = parking.getOccupiedCount();
        int fixedSubscription = parkingConfig.getFixedSubscriptionSpaces();

        System.out.println("🅿️ 주차장 ID: " + parkingId);
        System.out.println("📊 현재 점유수: " + occupied + " / 전체: " + total + " / 정기권 공간: " + fixedSubscription);

        // [3] 정기권 여부
        boolean isSubscribed = (memberId != null) && subscriptionService.isActiveSubscription(memberId);
        System.out.println("🔐 정기권 여부: " + isSubscribed);

        // [4] 입차 제한 조건
        int 일반차량허용한도 = total - fixedSubscription;
        if (!isSubscribed && occupied >= 일반차량허용한도) {
            System.out.println("🚫 입차 제한: 일반 차량 공간 부족");
            Map<String, Object> result = new HashMap<>();
            result.put("entryDenied", true);
            result.put("reason", "일반 차량을 위한 주차 공간이 모두 사용 중입니다.");
            result.put("parkingId", parkingId);
            return result;
        }

        // [5] 차량 등록
        Car car = new Car();
        car.setCarNumber(carNumber);
        car.setCarType("세단");
        car.setRegDate(LocalDateTime.now());

        if (memberId != null) {
            car.setMemberId(memberId);
            carMapper.insertCar(car);
            System.out.println("✅ 차량 등록: 회원 차량");
        } else {
            String guestToken = "guest-" + System.currentTimeMillis();
            car.setGuestToken(guestToken);
            carMapper.insertCarForGuest(car);
            System.out.println("✅ 차량 등록: 비회원 차량, token=" + guestToken);
        }

        // [6] 입차 로그 저장
        ParkingLog log = new ParkingLog();
        log.setCarNumber(carNumber);
        log.setEntryTime(LocalDateTime.now());
        log.setCreatedAt(LocalDateTime.now());
        log.setCameraId(cameraId);
        log.setIsPaid(false);
        log.setParkingType(isSubscribed ? "정기권" : "일일");
        log.setImagePath(lastImagePath);
        if (memberId != null) log.setMemberId(memberId);

        parkingLogMapper.insertLog(log);
        System.out.println("📝 입차 로그 저장 완료");

        // [7] 점유수 증가
        parkingMapper.increaseOccupiedCount(parkingId);
        System.out.println("📈 점유 수 증가 완료");

        // [8] 결과 반환
        Map<String, Object> result = new HashMap<>();
        result.put("plateNumber", carNumber);
        result.put("entryTime", log.getEntryTime().toString());
        result.put("image", lastImagePath);
        result.put("isMember", memberId != null);
        result.put("parkingId", parkingId);

        return result;
    }

    @Override
    public void setLastImagePath(String imagePath) {
        this.lastImagePath = imagePath;
    }

    @Override
    public String getLastImagePath() {
        return this.lastImagePath;
    }



}
