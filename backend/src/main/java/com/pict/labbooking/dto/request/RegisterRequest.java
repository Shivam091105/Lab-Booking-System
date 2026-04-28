package com.pict.labbooking.dto.request;

import com.pict.labbooking.entity.RoleName;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.Set;

/** DTO for new user registration */
@Data
public class RegisterRequest {

    @NotBlank @Size(min = 3, max = 50)
    private String username;

    @NotBlank @Size(min = 6, max = 100)
    private String password;

    @NotBlank @Email
    private String email;

    @NotBlank @Size(max = 100)
    private String fullName;

    private String phoneNumber;

    /** Student's class/division, e.g. "TE-A" */
    private String division;

    /** For CLUB_MANAGER role */
    private String clubName;

    private String department;

    @NotNull
    private Set<RoleName> roles;
}
