package com.pict.labbooking.dto.response;

import com.pict.labbooking.entity.TimetableSlot.SlotType;
import lombok.*;

import java.time.LocalTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TimetableSlotResponse {
    private Long id;
    private Long labId;
    private String labRoomNumber;
    private String dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private String subjectName;
    private String division;
    private String facultyName;
    private SlotType slotType;
<<<<<<< HEAD

    // ── Override fields (null when not overridden) ────────────────────────
    private Boolean isOverridden;
    private Long overriddenByEventId;
    private String overriddenByEventTitle;
}

=======
}
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
