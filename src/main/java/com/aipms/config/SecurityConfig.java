package com.aipms.config;

import com.aipms.security.CustomUserDetailsServiceImpl;
import com.aipms.service.CustomOAuth2UserService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsServiceImpl customUserDetailsService;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2AuthorizationRequestResolver customAuthorizationRequestResolver;

    // 비밀번호 암호화 빈 등록
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(customUserDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
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
                .headers(headers -> headers
                        .frameOptions(frameOptions -> frameOptions.sameOrigin())  // ✅ iframe sameOrigin 허용
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/fireDetect/detected").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/parking-log/logs").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/parking-log/logs").hasRole("ADMIN")
                        // 🔓 누구나 접근 가능
                        .requestMatchers(
                                "/favicon.ico", "/oauth/**","/logout",
                                "/error", "/error/**",
                                "/css/**", "/js/**", "/images/**", "/img/**",
                                "/api/entry/**", "/api/guest/token","/",
                                "/member/login", "/member/signup","/api/members/register",
                                "/api/members/{email}","/api/orders","/fast-payment",
                                "/detect","/api/parking/realtime-status",
                                "/api/parking/check-availability","/api/fee-policy/latest",
                                "/api/parking/**",
                                "/api/parking-config/getConfig", "/api/payment/validate",
                                "/search","/parking3d.html"
                        ).permitAll()

                        // 👤 일반 사용자 권한 (로그인 필요)
                        .requestMatchers(
                                "/api/cars/**","/dashboard", "/api/members/update",
                                "/api/membership/info","/reservation","/payment",
                                "/my-records", "/my-info","/my-info/update",
                                "/support","/api/parking/status",
                                "/api/parking/my-parking-status",
                                "/api/parking-log/current",
                                "/api/parking-log/exit",
                                "/api/parking-log/confirm-exit", "/api/payment/request",
                                "/api/payment/request","/api/payment/request",
                                "/api/payment/verify", "/api/payment/record",
                                "/api/payment/list", "/api/payment/reservation/daily",
                                "/api/payment/reservation/daily","/api/payment/summary",
                                "/api/reservations/daily", "/api/reservations/monthly",
                                "/api/reservations/{memberId}", "/api/reservations/**",
                                "/api/subscriptions/**","/api/usage/**","/api/user/**",
                                "/admin/policy/fee/all"


                        ).hasAnyRole("USER","ADMIN")

                        // 🛡️ 관리자 권한
                        .requestMatchers(
                                "/management/**","/api/adminDashboard/**",
                                "/api/cctv/**", "/admin/policy/**",
                                "/fire/logs/paged", "/fire/update-note",
                                "/reset", "/api/members/all", "/api/members/list",
                                "/api/members/modify/{id}", "/api/members/activate/{memberId}",
                                "/api/members/deactivate/{memberId}", "/api/members/summary",
                                "/api/alert/**","/api/management/parking/**",
                                "/api/payment/admin/refund","/admin/policy/refund/**",
                                "/api/parking-config/setConfig"

                                // ⚠️ 추가로 필요한 관리자 전용 경로 있으면 여기에
                        ).hasRole("ADMIN")

                        // 그 외 요청은 인증 필요 (기본 로그인)
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

                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/member/login") // 로그인 페이지
                        .defaultSuccessUrl("/dashboard", true)
                        .authorizationEndpoint(endpoint -> endpoint
                                .authorizationRequestResolver(customAuthorizationRequestResolver) // 👈 여기에 prompt=consent 붙이기
                        )
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService) // 위에서 만든 서비스
                        )
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
                            String uri = request.getRequestURI();
                            if ("/fireDetect/detected".equals(uri)) {
                                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                                response.setContentType("application/json;charset=UTF-8");
                                response.getWriter().write("{\"success\":false, \"message\":\"인증되지 않은 요청입니다.\"}");
                            } else {
                                response.sendRedirect("/member/login?error=unauth");
                            }
                        })
                )
                .authenticationProvider(authenticationProvider()); // ✅ 커스텀 UserDetailsService 등록

        return http.build();
    }
}
