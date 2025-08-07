package com.aipms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class Response<T> {
    private int code;
    private String message;
    private T data;

    public Response(T data) {
        this.code = 200;
        this.message = "success";
        this.data = data;
    }
}
