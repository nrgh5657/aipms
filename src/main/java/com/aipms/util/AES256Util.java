package com.aipms.util;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
//카카오 토큰 암호화 로직
public class AES256Util {

    private final String secretKey;

    public AES256Util(String secretKey) {
        this.secretKey = secretKey;
    }

    public String encrypt(String plainText) throws Exception {
        SecretKeySpec keySpec = new SecretKeySpec(secretKey.getBytes(), "AES");
        Cipher cipher = Cipher.getInstance("AES");
        cipher.init(Cipher.ENCRYPT_MODE, keySpec);
        byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(encrypted);
    }

    public String decrypt(String encryptedText) throws Exception {
        SecretKeySpec keySpec = new SecretKeySpec(secretKey.getBytes(), "AES");
        Cipher cipher = Cipher.getInstance("AES");
        cipher.init(Cipher.DECRYPT_MODE, keySpec);
        byte[] decoded = Base64.getDecoder().decode(encryptedText);
        return new String(cipher.doFinal(decoded), StandardCharsets.UTF_8);
    }
}
