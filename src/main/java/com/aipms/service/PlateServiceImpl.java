// com.aipms.service.impl.PlateServiceImpl.java
package com.aipms.service;

import com.aipms.dto.PlateDetectResponseDto;
import com.aipms.util.MultipartInputStreamFileResource;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class PlateServiceImpl implements PlateService {

    @Value("${ai.server.url}") // application.yml에는 http://localhost:5001 만 설정되어 있어야 함
    private String aiServerUrl;

    @Override
    public PlateDetectResponseDto detectPlateFromAI(MultipartFile file) throws IOException {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        // 전송용 바디 생성
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("image", new MultipartInputStreamFileResource(
                file.getInputStream(), file.getOriginalFilename(), file.getSize()
        ));

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        // 🔥 여기서 detect 경로 추가
        String detectUrl = aiServerUrl + "/detect";

        ResponseEntity<String> response = restTemplate.postForEntity(detectUrl, request, String.class);

        if (response.getStatusCode() == HttpStatus.OK) {
            JSONObject json = new JSONObject(response.getBody());

            String plateText = json.has("plateNumber")
                    ? json.getString("plateNumber")
                    : String.join(", ",
                    json.getJSONArray("plates")
                            .toList().stream()
                            .map(Object::toString).toList());

            String base64Image = json.getString("image") != null
                    ? json.getString("image")
                    : json.optString("imageBase64", "");

            return new PlateDetectResponseDto(plateText, base64Image);
        } else {
            throw new IOException("AI 서버로부터 인식 결과를 받지 못했습니다.");
        }
    }
}
