package com.aipms.service;

import com.aipms.domain.KakaoToken;
import com.aipms.dto.FireAlertDto;
import com.aipms.mapper.FireLogMapper;
import com.aipms.mapper.KakaoTokenMapper;
import com.aipms.util.AES256Util;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;



@Service
@RequiredArgsConstructor
public class KakaoMessageService {
    private final KakaoTokenMapper kakaoTokenMapper;
    private final AES256Util aes256Util;
    private final FireLogMapper fireLogMapper;

    //카카오 토큰을 활용해 나에게 메시지 보내기
    public void sendMessageToMe(String kakaoId, FireAlertDto fireAlertDto) {
        KakaoToken token = kakaoTokenMapper.findByKakaoId(kakaoId);

        // [1] 토큰이 없거나 잘못된 사용자 ID면 안 됨
        if (token == null) throw new IllegalStateException("해당 사용자의 토큰이 존재하지 않습니다.");

        // [2] 해당 토큰이 현재 로그인한 사용자 본인의 것인지 검증 (선택사항)

        String accessToken = null;
        try {
            accessToken = aes256Util.decrypt(token.getAccessToken());
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setBearerAuth(accessToken);

        FireAlertDto log = fireLogMapper.findLatestLog();
        if (log == null) throw new IllegalStateException("화재 로그 없음");

        String templateObject = """
        {
          "object_type": "text",
          "text": "🚨 화재 감지!\\n📍 위치: %s\\n🕒 시간: %s\\n🔥 신뢰도: %s",
          "link": {
            "web_url": "http://localhost:8080/management/fireManage",
            "mobile_web_url": "http://localhost:8080/management/fireManage"
          },
          "button_title": "화재 로그 보기"
        }
        """.formatted(log.getLocation(), log.getDetectedAt(), log.getConfidence());

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("template_object", templateObject);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        ResponseEntity<String> response = new RestTemplate().postForEntity(
                "https://kapi.kakao.com/v2/api/talk/memo/default/send",
                request,
                String.class
        );

        System.out.println("📨 응답 상태 코드: " + response.getStatusCode());
        System.out.println("📨 응답 본문: " + response.getBody());
    }

    // 특정 사용자(uuid 보유)에게 메시지 보내기
    public void sendMessageToFriend(String kakaoId, FireAlertDto fireAlertDto) {
        KakaoToken token = kakaoTokenMapper.findByKakaoId(kakaoId);

        if (token == null || token.getUuid() == null) {
            throw new IllegalStateException("해당 사용자에게 메시지를 보낼 수 없습니다 (토큰 또는 uuid 없음)");
        }

        String accessToken;
        try {
            accessToken = aes256Util.decrypt(token.getAccessToken());
        } catch (Exception e) {
            throw new IllegalStateException("토큰 복호화 실패", e);
        }

        FireAlertDto log = fireLogMapper.findLatestLog();
        if (log == null) throw new IllegalStateException("화재 로그 없음");

        String templateObject = """
    {
      "object_type": "text",
      "text": "🚨 화재 감지!\\n📍 위치: %s\\n🕒 시간: %s\\n🔥 신뢰도: %s",
      "link": {
        "web_url": "http://localhost:8080/management/fireManage",
        "mobile_web_url": "http://localhost:8080/management/fireManage"
      },
      "button_title": "화재 로그 보기"
    }
    """.formatted(log.getLocation(), log.getDetectedAt(), log.getConfidence());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setBearerAuth(accessToken);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("receiver_uuids", "[\"" + token.getUuid() + "\"]");
        params.add("template_object", templateObject);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        ResponseEntity<String> response = new RestTemplate().postForEntity(
                "https://kapi.kakao.com/v1/api/talk/friends/message/default/send",
                request,
                String.class
        );

        System.out.println("📨 [친구] 응답 코드: " + response.getStatusCode());
        System.out.println("📨 [친구] 응답 본문: " + response.getBody());
    }

}
