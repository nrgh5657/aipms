package com.aipms.service;

import com.aipms.dto.CarDto;

import java.util.List;

public interface CarService {
    void registerCar(CarDto carDto);
    void updateCar(CarDto carDto);
    void deleteCar(Long carId);
    List<CarDto> getMyCars(Long memberId);
    List<CarDto> getAllCars();
    CarDto getOneCar(Long carId);

    Long findMemberIdByNickname(String nickname);
}
