package com.aipms.service;

import com.aipms.domain.KakaoToken;
import com.aipms.mapper.KakaoTokenMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;


@Service
@RequiredArgsConstructor
public class KakaoMessageService {
    private final KakaoTokenMapper kakaoTokenMapper;

    public void sendMessageToMe(String kakaoId) {
        KakaoToken token = kakaoTokenMapper.findByKakaoId(kakaoId);
        if (token == null) throw new IllegalStateException("해당 사용자의 토큰이 존재하지 않습니다.");

        String accessToken = token.getAccessToken();

        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setBearerAuth(accessToken);

        String templateObject = """
    {
      "object_type": "text",
      "text": "🚨 화재 감지!\\n확인해주세요.",
      "link": {
        "web_url": "http://localhost:8080/fire-management",
        "mobile_web_url": "http://localhost:8080/fire-management"
      },
      "button_title": "화재 로그 보기"
    }
    """;

        String encodedTemplate = URLEncoder.encode(templateObject, StandardCharsets.UTF_8);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("template_object", encodedTemplate);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(
                "https://kapi.kakao.com/v1/api/talk/memo/default/send",
                request,
                String.class
        );

        System.out.println("📨 응답 상태 코드: " + response.getStatusCode());
        System.out.println("📨 응답 본문: " + response.getBody());
    }
}
