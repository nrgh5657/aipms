package com.aipms.service;

import com.aipms.domain.Parking;
import com.aipms.dto.LiveParkingStatusDto;
import com.aipms.dto.ParkingDto;
import com.aipms.mapper.ParkingConfigMapper;
import com.aipms.mapper.ParkingMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ParkingServiceImpl implements ParkingService {

    private final ParkingMapper parkingMapper;
    private final ParkingConfigMapper parkingConfigMapper;

    @Override
    public void register(ParkingDto dto) {
        Parking parking = toEntity(dto);
        parkingMapper.insert(parking);
    }

    @Override
    public ParkingDto get(Long id) {
        return toDto(parkingMapper.selectById(id));
    }

    @Override
    public List<ParkingDto> getAll() {
        return parkingMapper.selectAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public void update(ParkingDto dto) {
        parkingMapper.update(toEntity(dto));
    }

    @Override
    public void delete(Long id) {
        parkingMapper.delete(id);
    }

    private Parking toEntity(ParkingDto dto) {
        Parking p = new Parking();
        p.setParkingId(dto.getParkingId());
        p.setName(dto.getName());
        p.setLocation(dto.getLocation());
        p.setSpaceNo(dto.getSpaceNo());
        p.setIsOccupied(dto.getIsOccupied());
        p.setCctvUrl(dto.getCctvUrl());
        return p;
    }

    private ParkingDto toDto(Parking entity) {
        ParkingDto dto = new ParkingDto();
        dto.setParkingId(entity.getParkingId());
        dto.setName(entity.getName());
        dto.setLocation(entity.getLocation());
        dto.setSpaceNo(entity.getSpaceNo());
        dto.setIsOccupied(entity.getIsOccupied());
        dto.setCctvUrl(entity.getCctvUrl());
        return dto;
    }

    @Override
    public LiveParkingStatusDto getLiveParkingStatus() {
        int total = parkingMapper.sumTotalSpaces();        // 전체 주차면수
        int occupied = parkingMapper.sumOccupiedCount();   // 사용중 주차 수

        var config = parkingConfigMapper.getConfig();
        int fixed = 0;

        // ✅ 정기권 고정 공간 조회 + null 방지
        if (config != null) {
            fixed = config.getFixedSubscriptionSpaces(); // 어차피 null 아님
        }

        int available = total - occupied - fixed;
        if (available < 0) available = 0;

        LiveParkingStatusDto dto = new LiveParkingStatusDto();
        dto.setTotalSlots(total);
        dto.setOccupiedSlots(occupied);
        dto.setSubscriptionSlots(fixed); // ✅ 여기서도 fixed 사용
        dto.setAvailableSlots(available);
        dto.setOccupancyRate((int)((double)occupied / total * 100));

        return dto;
    }
}
