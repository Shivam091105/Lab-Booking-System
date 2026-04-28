package com.pict.labbooking.dto.response;

import com.pict.labbooking.entity.RoleName;
import lombok.*;

import java.util.Set;

/** JWT login success response */
@Data
@AllArgsConstructor
@Builder
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private Set<RoleName> roles;
}
