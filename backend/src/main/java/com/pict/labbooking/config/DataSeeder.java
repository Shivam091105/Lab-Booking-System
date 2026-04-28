package com.pict.labbooking.config;

import com.pict.labbooking.entity.*;
import com.pict.labbooking.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.List;
import java.util.Set;

/**
 * Seeds essential reference data on first startup:
 * - 4 labs (A1-302, A1-303, A1-306, A1-307)
 * - Weekly timetable slots
 * - Demo users for every role
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final LabRepository labRepo;
    private final TimetableSlotRepository slotRepo;
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (labRepo.count() == 0) seedLabs();
        if (userRepo.count() == 0) seedUsers();
        log.info("Data seeding complete.");
    }

    private void seedLabs() {
        log.info("Seeding labs...");

        Lab lab302 = labRepo.save(Lab.builder()
                .roomNumber("A1-302").labName("Computer Lab 1")
                .capacity(60).location("A1 Building, 3rd Floor")
                .hasProjector(true).hasAc(true)
                .description("General purpose computer lab with 60 systems").build());

        Lab lab303 = labRepo.save(Lab.builder()
                .roomNumber("A1-303").labName("Computer Lab 2")
                .capacity(60).location("A1 Building, 3rd Floor")
                .hasProjector(true).hasAc(true)
                .description("Networking and systems lab").build());

        Lab lab306 = labRepo.save(Lab.builder()
                .roomNumber("A1-306").labName("Project Lab")
                .capacity(40).location("A1 Building, 3rd Floor")
                .hasProjector(true).hasAc(false)
                .description("Project and research lab").build());

        Lab lab307 = labRepo.save(Lab.builder()
                .roomNumber("A1-307").labName("Seminar Hall")
                .capacity(120).location("A1 Building, 3rd Floor")
                .hasProjector(true).hasAc(true)
                .description("Large seminar hall for events and hackathons").build());

        seedTimetable(lab302, lab303, lab306);
        log.info("Labs seeded: A1-302, A1-303, A1-306, A1-307");
    }

    private void seedTimetable(Lab lab302, Lab lab303, Lab lab306) {
        // A1-302 timetable
        List.of(
            slot(lab302, "MONDAY",    "09:15", "10:15", "Data Structures",     "TE-A", "Prof. Sharma"),
            slot(lab302, "MONDAY",    "10:15", "11:15", "DBMS Lab",            "TE-B", "Prof. Kulkarni"),
            slot(lab302, "TUESDAY",   "11:30", "12:30", "OS Lab",              "SE-A", "Prof. Desai"),
            slot(lab302, "WEDNESDAY", "14:00", "15:00", "CN Lab",              "TE-A", "Prof. Joshi"),
            slot(lab302, "THURSDAY",  "09:15", "10:15", "ML Lab",              "BE-A", "Prof. Patil"),
            slot(lab302, "FRIDAY",    "10:15", "11:15", "Web Technology Lab",  "SE-B", "Prof. Sharma")
        ).forEach(slotRepo::save);

        // A1-303 timetable
        List.of(
            slot(lab303, "MONDAY",    "11:30", "12:30", "Java Lab",            "SE-A", "Prof. Mehta"),
            slot(lab303, "TUESDAY",   "09:15", "10:15", "Python Lab",          "TE-A", "Prof. Kulkarni"),
            slot(lab303, "WEDNESDAY", "10:15", "11:15", "Data Mining Lab",     "BE-B", "Prof. Desai"),
            slot(lab303, "THURSDAY",  "14:00", "15:00", "IoT Lab",             "TE-B", "Prof. Joshi"),
            slot(lab303, "FRIDAY",    "09:15", "10:15", "Cloud Computing Lab", "BE-A", "Prof. Patil")
        ).forEach(slotRepo::save);

        // A1-306 timetable
        List.of(
            slot(lab306, "TUESDAY",   "14:00", "15:00", "Project Work",        "BE-A", "Prof. Mehta"),
            slot(lab306, "THURSDAY",  "11:30", "12:30", "Research Lab",        "BE-B", "Prof. Sharma"),
            slot(lab306, "FRIDAY",    "14:00", "15:00", "Mini Project",        "TE-A", "Prof. Desai")
        ).forEach(slotRepo::save);
    }

    private TimetableSlot slot(Lab lab, String day, String start, String end,
                                String subject, String div, String faculty) {
        return TimetableSlot.builder()
                .lab(lab).dayOfWeek(day)
                .startTime(LocalTime.parse(start))
                .endTime(LocalTime.parse(end))
                .subjectName(subject).division(div).facultyName(faculty)
                .slotType(TimetableSlot.SlotType.REGULAR_CLASS)
                .build();
    }

    private void seedUsers() {
        log.info("Seeding demo users...");
        String pass = passwordEncoder.encode("password123");

        List.of(
            user("student1",      pass, "student1@pict.edu",   "Rahul Sharma",     Set.of(RoleName.STUDENT),           "TE-A", null,       "Computer Engineering"),
            user("student2",      pass, "student2@pict.edu",   "Priya Patel",      Set.of(RoleName.STUDENT),           "SE-B", null,       "Computer Engineering"),
            user("acm_manager",   pass, "acm@pict.edu",        "Arjun Nair",       Set.of(RoleName.CLUB_MANAGER),      null,   "PICT ACM", "Computer Engineering"),
            user("ieee_manager",  pass, "ieee@pict.edu",       "Sneha Rao",        Set.of(RoleName.CLUB_MANAGER),      null,   "PICT IEEE","Electronics Engineering"),
            user("inc_manager",   pass, "inc@pict.edu",        "Rohan Gupta",      Set.of(RoleName.CLUB_MANAGER),      null,   "PICT INC", "Information Technology"),
            user("lab_assist",    pass, "labassist@pict.edu",  "Suresh Kale",      Set.of(RoleName.LAB_ASSISTANT),     null,   null,       "Computer Engineering"),
            user("prof_sharma",   pass, "psharma@pict.edu",    "Prof. A. Sharma",  Set.of(RoleName.PROFESSOR),         null,   null,       "Computer Engineering"),
            user("cc_desai",      pass, "ccdesai@pict.edu",    "Prof. B. Desai",   Set.of(RoleName.CLASS_COORDINATOR), null,   null,       "Computer Engineering"),
            user("hod_kumar",     pass, "hod@pict.edu",        "Dr. P. Kumar",     Set.of(RoleName.HOD),               null,   null,       "Computer Engineering"),
            user("principal",     pass, "principal@pict.edu",  "Dr. S. Joshi",     Set.of(RoleName.PRINCIPAL),         null,   null,       "Administration")
        ).forEach(userRepo::save);

        log.info("Demo users seeded. Default password: password123");
    }

    private User user(String username, String pass, String email, String name,
                      Set<RoleName> roles, String div, String club, String dept) {
        return User.builder()
                .username(username).password(pass).email(email).fullName(name)
                .roles(roles).division(div).clubName(club).department(dept)
                .isActive(true).build();
    }
}
