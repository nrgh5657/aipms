package com.aipms.service;

import com.aipms.domain.Car;
import com.aipms.domain.Member;
import com.aipms.dto.CarDto;
import com.aipms.mapper.CarMapper;
import com.aipms.mapper.MemberMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CarServiceImpl implements CarService {

    private final CarMapper carMapper;
    private final MemberMapper memberMapper;

    @Override
    public void registerCar(CarDto carDto) {
        Car car = convertToEntity(carDto);
        carMapper.insertCar(car);
    }

    @Override
    public void updateCar(CarDto carDto) {
        Car car = convertToEntity(carDto);
        carMapper.updateCar(car);
    }

    @Override
    public void deleteCar(Long carId) {
        carMapper.deleteCar(carId);
    }

    @Override
    public List<CarDto> getMyCars(Long memberId) {
        return carMapper.selectCarsByUserID(memberId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<CarDto> getAllCars() {
        return carMapper.selectAllCars().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public CarDto getOneCar(Long carId) {
        return convertToDto(carMapper.selectOneCar(carId));
    }

    @Override
    public Long findMemberIdByNickname(String nickname) {
        Member member = memberMapper.findByName(nickname); // Mapper에 정의 필요
        if (member == null) return null;
        return member.getMemberId();
    }

    private Car convertToEntity(CarDto dto) {
        Car car = new Car();
        car.setCarId(dto.getCarId());
        car.setMemberId(dto.getMemberId());
        car.setCarNumber(dto.getCarNumber());
        car.setCarType(dto.getCarType());
        car.setRegDate(dto.getRegDate());
        return car;
    }

    private CarDto convertToDto(Car car) {
        CarDto dto = new CarDto();
        dto.setCarId(car.getCarId());
        dto.setMemberId(car.getMemberId());
        dto.setCarNumber(car.getCarNumber());
        dto.setCarType(car.getCarType());
        dto.setRegDate(car.getRegDate());
        return dto;
    }
}
