package com.aipms.service;

import com.siot.IamportRestClient.IamportClient;
import com.siot.IamportRestClient.exception.IamportResponseException;
import com.siot.IamportRestClient.request.CancelData;
import com.siot.IamportRestClient.response.IamportResponse;
import com.siot.IamportRestClient.response.Payment;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;

@Service
public class IamportService {

    private final IamportClient iamportClient;

    public IamportService(
            @Value("${iamport.api-key}") String apiKey,
            @Value("${iamport.api-secret}") String apiSecret
    ) {
        this.iamportClient = new IamportClient(apiKey, apiSecret);
    }

    public boolean refund(String impUid, int amount) {
        try {
            CancelData cancelData = new CancelData(impUid, true, BigDecimal.valueOf(amount));
            IamportResponse<Payment> response = iamportClient.cancelPaymentByImpUid(cancelData);

            Payment result = response.getResponse();
            return result != null && "cancelled".equals(result.getStatus());

        } catch (IamportResponseException | IOException e) {
            System.err.println("❌ 아임포트 환불 실패: " + e.getMessage());
            return false;
        }
    }
}
