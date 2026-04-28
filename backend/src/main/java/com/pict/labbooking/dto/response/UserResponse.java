package com.pict.labbooking.dto.response;

import com.pict.labbooking.entity.RoleName;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String division;
    private String clubName;
    private String department;
    private Boolean isActive;
    private Set<RoleName> roles;
    private LocalDateTime createdAt;
}
