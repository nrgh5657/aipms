package com.aipms.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileService {
    String saveProfileImage(MultipartFile file) throws Exception;
}
