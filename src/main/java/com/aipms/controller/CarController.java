package com.aipms.controller;

import com.aipms.dto.CarDto;
import com.aipms.security.CustomUserDetails;
import com.aipms.service.CarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cars")
@RequiredArgsConstructor
public class CarController {

    private final CarService carService;

    @PostMapping("/register")
    public ResponseEntity<String> registerCar(@RequestBody CarDto carDto) {
        carService.registerCar(carDto);
        return ResponseEntity.ok("차량 등록 완료");
    }

    @PutMapping("/update")
    public ResponseEntity<String> updateCar(@RequestBody CarDto carDto) {
        carService.updateCar(carDto);
        return ResponseEntity.ok("차량 정보 수정 완료");
    }

    @DeleteMapping("/{vehicleId}")
    public ResponseEntity<String> deleteCar(@PathVariable Long vehicleId) {
        carService.deleteCar(vehicleId);
        return ResponseEntity.ok("차량 삭제 완료");
    }

    @GetMapping("/my")
    public ResponseEntity<List<CarDto>> getMyCars(@AuthenticationPrincipal CustomUserDetails user) {
        Long memberId = user.getMember().getMemberId();
        return ResponseEntity.ok(carService.getMyCars(memberId));
    }

    @GetMapping("/all")
    public ResponseEntity<List<CarDto>> getAllCars() {
        return ResponseEntity.ok(carService.getAllCars());
    }

    @GetMapping("/{vehicleId}")
    public ResponseEntity<CarDto> getOneCar(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(carService.getOneCar(vehicleId));
    }
}
