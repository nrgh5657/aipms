package com.aipms;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@MapperScan("com.aipms.mapper")
public class AipmsApplication {

    public static void main(String[] args) {
        SpringApplication.run(AipmsApplication.class, args);
    }

}
