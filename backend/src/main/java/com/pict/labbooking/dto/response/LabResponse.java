package com.pict.labbooking.dto.response;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LabResponse {
    private Long id;
    private String roomNumber;
    private String labName;
    private Integer capacity;
    private String location;
    private Boolean hasProjector;
    private Boolean hasAc;
    private Boolean isActive;
    private String description;
}
