package com.aipms.config;

import com.aipms.util.AES256Util;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class EncryptionConfig {
    @Value("${encrypt.secret-key}")
    private String secretKey;

    @Bean
    public AES256Util aes256Util() {
        return new AES256Util(secretKey);
    }
}
