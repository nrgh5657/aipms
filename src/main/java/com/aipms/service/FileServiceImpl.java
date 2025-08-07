package com.aipms.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

@Service
public class FileServiceImpl implements FileService {

    private final String uploadDir = "C:/upload/profile"; // 원하는 경로로 변경하세요

    @Override
    public String saveProfileImage(MultipartFile file) throws IOException {
        if (file.isEmpty()) throw new IllegalArgumentException("빈 파일입니다.");

        File dir = new File(uploadDir);
        if (!dir.exists()) dir.mkdirs();

        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String savedName = UUID.randomUUID() + extension;

        File dest = new File(dir, savedName);
        file.transferTo(dest);

        return savedName;
    }
}
