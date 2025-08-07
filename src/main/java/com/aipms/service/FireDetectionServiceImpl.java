package com.aipms.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class FireDetectionServiceImpl implements FireDetectionService {

    private RestTemplate restTemplate = new RestTemplate();

    @Override
    public boolean resetFireStatus(String cameraId) {
        try {
            String url = "http://localhost:5000/reset-fire?camera=" + cameraId;
            restTemplate.getForObject(url, String.class);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
