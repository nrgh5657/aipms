package com.aipms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class PageDto<T> {
    private List<T> content;
    private int totalElements;
    private int currentPage;
    private int pageSize;
    private int totalPages;

    public PageDto(List<T> content, int totalElements, int currentPage, int pageSize) {
        this.content = content;
        this.totalElements = totalElements;
        this.currentPage = currentPage;
        this.pageSize = pageSize;
        this.totalPages = (int) Math.ceil((double) totalElements / pageSize);  // ✅ 핵심
    }

    public PageDto(int page, int limit, int totalElements) {
        this.currentPage = page;
        this.pageSize = limit;
        this.totalElements = totalElements;
        this.totalPages = (int) Math.ceil((double) totalElements / pageSize);
    }

}
