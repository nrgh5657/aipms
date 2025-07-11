package com.aipms.config;

import com.aipms.security.CustomUserDetailsServiceImpl;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsServiceImpl customUserDetailsService;

    // 비밀번호 암호화 빈 등록
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // AuthenticationManager 등록
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // Spring Security 필터 체인 설정
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/", "/favicon.ico",
                                "/css/**", "/js/**", "/images/**", "/img/**",
                                "/member/login", "/member/signup", "/logout",
                                "/admin-dashboard", "/my-records", "/signup",
                                "/api/members/register","/api/members/check-email",
                                "/fire/**"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .formLogin(form -> form
                        .loginPage("/member/login") // 사용자 정의 로그인 페이지
                        .loginProcessingUrl("/login") // 로그인 요청 처리 URL
                        .usernameParameter("username") // 폼에서 사용자명 필드
                        .passwordParameter("password") // 폼에서 비밀번호 필드
                        .defaultSuccessUrl("/dashboard", true) // 로그인 성공 시 이동 경로
                        .failureUrl("/member/login?error=true") // 실패 시 이동 경로
                        .permitAll()
                )
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                        .permitAll()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                )
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.sendRedirect("/member/login?error=unauth");
                        })
                )
                .userDetailsService(customUserDetailsService); // ✅ 커스텀 UserDetailsService 등록

        return http.build();
    }
}
