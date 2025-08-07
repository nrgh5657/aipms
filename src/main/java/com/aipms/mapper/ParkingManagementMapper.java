package com.aipms.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface ParkingManagementMapper {


    Long getWeeklyRevenueOfMonth(@Param("year") int year,
                                 @Param("month") int month,
                                 @Param("startDay") int startDay,
                                 @Param("endDay") int endDay);

    List<Map<String, Object>> getMonthlyRevenueOfYear(int year);

}
