package com.aipms.controller;

import com.aipms.domain.Member;
import com.aipms.domain.ParkingLog;
import com.aipms.dto.FeePolicyDto;
import com.aipms.dto.MemberDto;
import com.aipms.dto.MyPageInfoDto;
import com.aipms.dto.PlateSearchResponseDto;
import com.aipms.mapper.ParkingLogMapper;
import com.aipms.security.CustomUserDetails;
import com.aipms.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class PageController {

    private final SubscriptionService subscriptionService;
    private final ParkingLogMapper parkingLogMapper;
    private final MembershipService membershipService;
    private final AccountService accountService;
    private final CarService carService;
    private final MyPageInfoService myPageInfoService;
    private final FileService fileService;
    private final FeePolicyService feePolicyService;

    // ✅ 유저 정보 공통 모델 처리 메서드 (통합본)
    private void addUserDataToModel(CustomUserDetails userDetails, Model model) {
        if (userDetails == null) return;

        Member member = userDetails.getMember();
        model.addAttribute("member", member);
        model.addAttribute("nickname", member.getName());

        // 전체 userData 구성 (JSON)
        Map<String, Object> userData = new HashMap<>();
        userData.put("memberId", member.getMemberId());
        userData.put("user", member.getName());
        userData.put("role", member.getRole());
        userData.put("email", member.getEmail());
        userData.put("phone", member.getPhone());
        userData.put("customerUid", subscriptionService.getCustomerUid(member.getMemberId()));
        model.addAttribute("userDataJson", new Gson().toJson(userData));

        // 마이페이지 정보까지 포함
        MyPageInfoDto dto = myPageInfoService.getMyPageInfo(member.getMemberId());
        model.addAttribute("myInfo", dto);
    }

    @GetMapping("/reservation")
    public String reservationPage(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
        if (userDetails == null) return "redirect:/member/login";
        addUserDataToModel(userDetails, model);
        return "reservation";
    }

    @GetMapping("/payment")
    public String paymentPage(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
        if (userDetails == null) return "redirect:/member/login";
        addUserDataToModel(userDetails, model);
        return "payment";
    }

    @GetMapping("/my-records")
    public String recordsPage(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
        if (userDetails == null) return "redirect:/member/login";
        addUserDataToModel(userDetails, model);
        return "my-records";
    }

    @GetMapping("/my-info")
    public String myInfo(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
        if (userDetails == null) return "redirect:/member/login";

        addUserDataToModel(userDetails, model);

        try {
            MyPageInfoDto myInfo = (MyPageInfoDto) model.getAttribute("myInfo");

            if (myInfo != null && myInfo.getMemberInfo() != null) {
                ObjectMapper objectMapper = new ObjectMapper();
                Map<String, Object> userData = new HashMap<>();
                userData.put("name", myInfo.getMemberInfo().getName());
                userData.put("birth", myInfo.getMemberInfo().getBirth());
                userData.put("phone", myInfo.getMemberInfo().getPhone());
                userData.put("email", myInfo.getMemberInfo().getEmail());
                userData.put("profileImage", myInfo.getMemberInfo().getProfileImage());

                model.addAttribute("userDataJson", objectMapper.writeValueAsString(userData));
            } else {
                model.addAttribute("userDataJson", "{}");
            }
        } catch (Exception e) {
            model.addAttribute("userDataJson", "{}");
            System.err.println("JSON 생성 오류: " + e.getMessage());
        }

        return "my-info";
    }

    @PostMapping("/my-info/update")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal CustomUserDetails userDetails,
                                           @ModelAttribute MemberDto memberDto,
                                           @RequestParam(value = "profileImage", required = false) MultipartFile profileImageFile,
                                           HttpServletRequest request,
                                           RedirectAttributes redirectAttributes) {

        boolean isAjaxRequest = "XMLHttpRequest".equals(request.getHeader("X-Requested-With"));

        try {
            if (profileImageFile != null && !profileImageFile.isEmpty()) {
                String fileName = fileService.saveProfileImage(profileImageFile);
                memberDto.setProfileImage(fileName);
            }

            myPageInfoService.updateMemberInfo(userDetails.getMemberId(), memberDto);

            if (isAjaxRequest) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "정보가 성공적으로 수정되었습니다.");
                response.put("updatedInfo", Map.of(
                        "name", memberDto.getName(),
                        "email", memberDto.getEmail(),
                        "phone", memberDto.getPhone(),
                        "profileImage", memberDto.getProfileImage()
                ));
                return ResponseEntity.ok(response);
            } else {
                redirectAttributes.addFlashAttribute("successMessage", "정보가 성공적으로 수정되었습니다.");
                return ResponseEntity.status(HttpStatus.FOUND).header("Location", "/my-info").build();
            }

        } catch (Exception e) {
            if (isAjaxRequest) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "수정 중 오류가 발생했습니다: " + e.getMessage());
                return ResponseEntity.badRequest().body(errorResponse);
            } else {
                redirectAttributes.addFlashAttribute("errorMessage", "수정 중 오류가 발생했습니다.");
                return ResponseEntity.status(HttpStatus.FOUND).header("Location", "/my-info").build();
            }
        }
    }

    @GetMapping("/support")
    public String supportPage(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
        if (userDetails == null) return "redirect:/member/login";
        addUserDataToModel(userDetails, model);
        return "support";
    }

    @GetMapping("/search")
    public ResponseEntity<PlateSearchResponseDto> searchPlate(@RequestParam("plate") String plate, HttpSession session) {
        ParkingLog log = parkingLogMapper.findLatestUnpaidLogByCarNumber(plate);
        if (log == null) return ResponseEntity.notFound().build();

        boolean isMember = log.getMemberId() != null;
        double discountRate = isMember ? 0.2 : 0.0;

        // ✅ 요금 정책 불러오기
        FeePolicyDto policy = feePolicyService.getActivePolicyByType("TIME");
        if (policy == null) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }

        PlateSearchResponseDto response = PlateSearchResponseDto.builder()
                .plateNumber(log.getCarNumber())
                .entryTime(log.getEntryTime().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .imagePath(log.getImagePath())
                .isMember(isMember)
                .discountRate(discountRate)
                .id(log.getId())
                // ✅ 요금 정책 추가
                .baseFee(policy.getBaseFee())
                .unitMinutes(policy.getUnitMinutes())
                .maxFee(policy.getMaxFee())
                .build();

        return ResponseEntity.ok(response);
    }




}
