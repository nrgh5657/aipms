package com.aipms.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/",
                                "/login",
                                "/admin-dashboard",
                                "/my-records",
                                "/signup",
                                "/fire/**",
                                "/css/**", "/js/**", "/img/**").permitAll()

                )
                .formLogin(form -> form
                        .loginPage("/login")
                        .permitAll()
                )
                .csrf(csrf ->csrf.disable());

        return http.build();  // ✅ 이 줄이 꼭 필요합니다!

    }
}
