package com.aipms.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 정적 리소스 (이미지 등) 제공 경로 매핑
        registry.addResourceHandler("/images/fire/**")
                .addResourceLocations("file:///C://Users//M//yolo-fire//detected_images/") // 실제 이미지 폴더 경로로 수정하세요
                .setCachePeriod(3600); // 캐시 설정 (선택)
    }
}
