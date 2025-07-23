package com.aipms.mapper;

import com.aipms.domain.Car;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface CarMapper {
    void insertCar(Car car);
    void insertCarForGuest(Car car);
    void updateCar(Car car);
    void deleteCar(Long carId);
    List<Car> selectCarsByUserID(Long memberId);
    List<Car> selectAllCars();
    Car selectOneCar(Long carId);
    Car findByCarNumber(String carNumber);
}
