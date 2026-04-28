# PICT Lab Booking System

A full-stack, production-ready web application for managing lab bookings at PICT (Pune Institute of Computer Technology) with hierarchical approval workflows, role-based dashboards, and real-time availability tracking.

---

## 1. HIGH-LEVEL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│              React 18 + Vite + Tailwind CSS                     │
│   Pages: Login │ Dashboard │ Book Lab │ Approvals │ Schedule    │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP/HTTPS  (JWT in Authorization header)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Nginx (Port 80)                             │
│          Static file serving + /api reverse proxy               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              Spring Boot Backend (Port 8080)                    │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │  Security   │  │  Controllers│  │   Services           │   │
│  │  JWT Filter │→ │  /auth      │→ │   AuthService        │   │
│  │  Spring Sec │  │  /bookings  │  │   BookingService     │   │
│  └─────────────┘  │  /labs      │  │   LabService         │   │
│                   └─────────────┘  │   EmailService       │   │
│                                    └──────────────────────┘   │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                   Repository Layer (JPA)               │   │
│  │  UserRepo │ BookingRepo │ LabRepo │ ApprovalRepo        │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────┘
                          │ JDBC
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              PostgreSQL 16 (Port 5432)                          │
│  Tables: users │ labs │ booking_requests │ approvals │          │
│          timetable_slots │ booking_labs │ user_roles            │
└─────────────────────────────────────────────────────────────────┘
```

### Layered Backend Architecture
```
HTTP Request
    │
    ▼
[JwtAuthenticationFilter]  ← validates Bearer token
    │
    ▼
[Controller]               ← @PreAuthorize RBAC, input validation
    │
    ▼
[Service]                  ← business logic, workflow engine
    │
    ▼
[Repository]               ← Spring Data JPA queries
    │
    ▼
[Entity / DB]              ← Hibernate ORM → PostgreSQL
```

---

## 2. DATABASE SCHEMA

### ER Diagram (Text)

```
users (1) ──────────────────── (N) user_roles
  │                                  [user_id, role]
  │ (1)
  │ requester_id
  ▼ (N)
booking_requests (N) ──── (N) labs          [via booking_labs junction]
  │ (1)                          │
  │                              ▼ (N)
  ▼ (N)                   timetable_slots
approvals
  │ approver_id (nullable FK → users)
```

### Table Schemas

#### `users`
| Column       | Type         | Constraints            |
|--------------|--------------|------------------------|
| id           | BIGSERIAL    | PK                     |
| username     | VARCHAR(50)  | UNIQUE NOT NULL        |
| password     | VARCHAR(255) | NOT NULL (bcrypt)      |
| email        | VARCHAR(255) | UNIQUE NOT NULL        |
| full_name    | VARCHAR(100) | NOT NULL               |
| phone_number | VARCHAR(20)  |                        |
| division     | VARCHAR(20)  | e.g. "TE-A"            |
| club_name    | VARCHAR(100) | e.g. "PICT ACM"        |
| department   | VARCHAR(100) |                        |
| is_active    | BOOLEAN      | DEFAULT true           |
| created_at   | TIMESTAMP    |                        |
| updated_at   | TIMESTAMP    |                        |

#### `user_roles`
| Column  | Type        | Constraints    |
|---------|-------------|----------------|
| user_id | BIGINT      | FK → users(id) |
| role    | VARCHAR(30) | ENUM value     |

**RoleName enum:** `STUDENT, CLUB_MANAGER, LAB_ASSISTANT, PROFESSOR, CLASS_COORDINATOR, HOD, PRINCIPAL`

#### `labs`
| Column       | Type         | Constraints     |
|--------------|--------------|-----------------|
| id           | BIGSERIAL    | PK              |
| room_number  | VARCHAR(20)  | UNIQUE NOT NULL |
| lab_name     | VARCHAR(100) | NOT NULL        |
| capacity     | INTEGER      | NOT NULL        |
| location     | VARCHAR(200) | NOT NULL        |
| has_projector| BOOLEAN      | DEFAULT false   |
| has_ac       | BOOLEAN      | DEFAULT false   |
| is_active    | BOOLEAN      | DEFAULT true    |
| description  | TEXT         |                 |

**Seeded labs:** A1-302, A1-303, A1-306, A1-307

#### `booking_requests`
| Column                  | Type         | Constraints                 |
|-------------------------|--------------|-----------------------------|
| id                      | BIGSERIAL    | PK                          |
| reference_number        | VARCHAR(20)  | UNIQUE NOT NULL (LB-YYYY-N) |
| requester_id            | BIGINT       | FK → users(id)              |
| request_type            | VARCHAR(30)  | EXTRA_CLASS/CLUB_EVENT/MULTI_LAB_EVENT |
| booking_date            | DATE         | NOT NULL                    |
| start_time              | TIME         | NOT NULL                    |
| end_time                | TIME         | NOT NULL                    |
| purpose                 | VARCHAR(500) | NOT NULL                    |
| expected_attendees      | INTEGER      |                             |
| club_name               | VARCHAR(100) |                             |
| event_name              | VARCHAR(200) |                             |
| additional_requirements | TEXT         |                             |
| status                  | VARCHAR(20)  | PENDING/IN_REVIEW/APPROVED/REJECTED/CANCELLED |
| rejection_reason        | TEXT         |                             |
| division                | VARCHAR(20)  |                             |
| created_at              | TIMESTAMP    |                             |
| updated_at              | TIMESTAMP    |                             |

#### `booking_labs` (Junction)
| Column     | Type   | Constraints                  |
|------------|--------|------------------------------|
| booking_id | BIGINT | FK → booking_requests(id)    |
| lab_id     | BIGINT | FK → labs(id)                |

#### `approvals`
| Column             | Type        | Constraints               |
|--------------------|-------------|---------------------------|
| id                 | BIGSERIAL   | PK                        |
| booking_request_id | BIGINT      | FK → booking_requests(id) |
| approver_role      | VARCHAR(30) | RoleName enum             |
| approver_id        | BIGINT      | FK → users(id), nullable  |
| approval_order     | INTEGER     | NOT NULL (1,2,3…)         |
| status             | VARCHAR(20) | PENDING/APPROVED/REJECTED/SKIPPED |
| comments           | TEXT        |                           |
| is_auto_approved   | BOOLEAN     | DEFAULT false             |
| acted_at           | TIMESTAMP   |                           |
| created_at         | TIMESTAMP   |                           |

#### `timetable_slots`
| Column       | Type        | Constraints          |
|--------------|-------------|----------------------|
| id           | BIGSERIAL   | PK                   |
| lab_id       | BIGINT      | FK → labs(id)        |
| day_of_week  | VARCHAR(10) | MONDAY…SATURDAY      |
| start_time   | TIME        | NOT NULL             |
| end_time     | TIME        | NOT NULL             |
| subject_name | VARCHAR(100)|                      |
| division     | VARCHAR(20) |                      |
| faculty_name | VARCHAR(100)|                      |
| slot_type    | VARCHAR(20) | REGULAR_CLASS/BOOKED/FREE |

---

## 3. APPROVAL WORKFLOW

### Case 1 — Extra Class (EXTRA_CLASS)
```
Submit → [LAB_ASSISTANT order:1] → [PROFESSOR order:2] → [CLASS_COORDINATOR order:3]

Rule: If PROFESSOR or CLASS_COORDINATOR approves → AUTO-APPROVE entire request
      Lab Assistant approval is optional/informational only
```

### Case 2 — Club/Multi-Lab Events (CLUB_EVENT / MULTI_LAB_EVENT)
```
Submit → [LAB_ASSISTANT:1] → [CLUB_MANAGER:2] → [PROFESSOR:3] → [HOD:4] → [PRINCIPAL:5]

Rule: Higher authority approving → auto-approves ALL lower pending steps
      Any level rejecting → entire request REJECTED immediately
```

---

## 4. API DOCUMENTATION

**Base URL:** `http://localhost:8080/api`  
**Auth:** `Authorization: Bearer <JWT_TOKEN>`

### Authentication Endpoints

#### POST `/auth/login`
Login and receive JWT token.
```json
Request:
{ "username": "student1", "password": "password123" }

Response 200:
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "type": "Bearer",
    "id": 1,
    "username": "student1",
    "email": "student1@pict.edu",
    "fullName": "Rahul Sharma",
    "roles": ["STUDENT"]
  }
}
```

#### POST `/auth/register`
Register a new user.
```json
Request:
{
  "username": "newstudent",
  "password": "securepass",
  "email": "new@pict.edu",
  "fullName": "New Student",
  "division": "TE-A",
  "department": "Computer Engineering",
  "roles": ["STUDENT"]
}

Response 201: { "success": true, "data": { ...UserResponse } }
```

#### GET `/auth/me`  🔒
Get current user profile.

---

### Lab Endpoints

#### GET `/labs`  🔒
Get all active labs.
```json
Response: { "data": [{ "id":1, "roomNumber":"A1-302", "labName":"Computer Lab 1", ... }] }
```

#### GET `/labs/{id}/timetable`  🔒
Get full weekly timetable for a lab.

#### GET `/labs/{id}/timetable/{day}`  🔒
Get timetable for a specific day (e.g., `MONDAY`).

#### GET `/labs/{id}/availability?date=2025-01-15`  🔒
Get approved bookings + timetable for a lab on a date.

---

### Booking Endpoints

#### POST `/bookings`  🔒 `[STUDENT, CLUB_MANAGER]`
Submit a new booking request.
```json
Request:
{
  "requestType": "EXTRA_CLASS",
  "bookingDate": "2025-02-01",
  "startTime": "14:00",
  "endTime": "15:00",
  "purpose": "Extra DBMS lecture for TE-A",
  "expectedAttendees": 55,
  "labIds": [1],
  "division": "TE-A"
}

Response 201:
{
  "success": true,
  "data": {
    "id": 1,
    "referenceNumber": "LB-2025-0001",
    "status": "IN_REVIEW",
    "approvals": [
      { "approverRole": "LAB_ASSISTANT", "approvalOrder": 1, "status": "PENDING" },
      { "approverRole": "PROFESSOR",     "approvalOrder": 2, "status": "PENDING" },
      { "approverRole": "CLASS_COORDINATOR", "approvalOrder": 3, "status": "PENDING" }
    ],
    ...
  }
}
```

#### GET `/bookings/my`  🔒
Get the authenticated user's own bookings.

#### GET `/bookings/{id}`  🔒
Get a single booking with full approval timeline.

#### GET `/bookings`  🔒 `[LAB_ASSISTANT, PROFESSOR, CLASS_COORDINATOR, HOD, PRINCIPAL]`
Get all bookings (admin view).

#### GET `/bookings/pending-approvals`  🔒 `[approver roles]`
Get bookings pending the caller's role for approval.

#### POST `/bookings/{id}/approve`  🔒 `[approver roles]`
Approve or reject a booking.
```json
Request:
{ "action": "APPROVED", "comments": "Looks good, approved." }
// or
{ "action": "REJECTED", "comments": "Lab unavailable due to maintenance." }

Response 200: { "success": true, "data": { ...updated BookingResponse } }
```

#### PATCH `/bookings/{id}/cancel`  🔒
Cancel your own pending booking.

#### GET `/bookings/analytics/status-counts`  🔒 `[HOD, PRINCIPAL]`
Get counts grouped by status for the analytics dashboard.
```json
Response: { "data": { "APPROVED": 12, "PENDING": 3, "REJECTED": 2 } }
```

---

### Error Response Format
All errors return the same envelope:
```json
{
  "success": false,
  "message": "Descriptive error message",
  "timestamp": "2025-01-15T10:30:00"
}
```

**HTTP Status Codes:**
| Code | Meaning                        |
|------|--------------------------------|
| 200  | Success                        |
| 201  | Created                        |
| 400  | Validation error / Bad request |
| 401  | Unauthenticated                |
| 403  | Forbidden (wrong role)         |
| 404  | Resource not found             |
| 409  | Booking conflict               |
| 500  | Internal server error          |

---

## 5. DEMO USERS

All demo users have password: **`password123`**

| Username      | Role              | Details              |
|---------------|-------------------|----------------------|
| student1      | STUDENT           | Division: TE-A       |
| student2      | STUDENT           | Division: SE-B       |
| acm_manager   | CLUB_MANAGER      | Club: PICT ACM       |
| ieee_manager  | CLUB_MANAGER      | Club: PICT IEEE      |
| inc_manager   | CLUB_MANAGER      | Club: PICT INC       |
| lab_assist    | LAB_ASSISTANT     |                      |
| prof_sharma   | PROFESSOR         |                      |
| cc_desai      | CLASS_COORDINATOR |                      |
| hod_kumar     | HOD               |                      |
| principal     | PRINCIPAL         |                      |

---

## 6. PROJECT STRUCTURE

```
lab-booking-system/
├── docker-compose.yml
├── .env.example
├── scripts/
│   └── init.sql
│
├── backend/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/pict/labbooking/
│       ├── LabBookingApplication.java
│       ├── config/
│       │   ├── SecurityConfig.java
│       │   └── DataSeeder.java
│       ├── controller/
│       │   ├── AuthController.java
│       │   ├── BookingController.java
│       │   └── LabController.java
│       ├── dto/
│       │   ├── request/  (LoginRequest, RegisterRequest, BookingRequestDto, ApprovalActionRequest)
│       │   └── response/ (ApiResponse, JwtResponse, BookingResponse, ApprovalResponse, LabResponse, ...)
│       ├── entity/
│       │   ├── User.java
│       │   ├── Lab.java
│       │   ├── BookingRequest.java
│       │   ├── Approval.java
│       │   ├── TimetableSlot.java
│       │   └── RoleName.java
│       ├── exception/
│       │   ├── GlobalExceptionHandler.java
│       │   ├── ResourceNotFoundException.java
│       │   └── BookingConflictException.java
│       ├── repository/
│       │   ├── UserRepository.java
│       │   ├── LabRepository.java
│       │   ├── BookingRequestRepository.java
│       │   ├── ApprovalRepository.java
│       │   └── TimetableSlotRepository.java
│       ├── security/
│       │   ├── JwtUtils.java
│       │   ├── JwtAuthenticationFilter.java
│       │   └── UserDetailsServiceImpl.java
│       ├── service/impl/
│       │   ├── AuthService.java
│       │   ├── BookingService.java       ← approval workflow engine
│       │   ├── LabService.java
│       │   └── EmailService.java
│       └── util/
│           └── MapperUtil.java
│
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx                 ← routes + providers
        ├── main.jsx
        ├── index.css               ← Tailwind + custom utility classes
        ├── api/index.js            ← Axios instance + all API calls
        ├── context/AuthContext.jsx ← JWT state, login/logout
        ├── components/
        │   ├── common/StatusBadge.jsx
        │   └── layout/AppLayout.jsx  ← sidebar + header
        └── pages/
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── DashboardPage.jsx      ← role-aware stats + quick actions
            ├── BookingFormPage.jsx    ← multi-step booking form
            ├── MyBookingsPage.jsx     ← student/club manager list
            ├── BookingDetailPage.jsx  ← full detail + approval timeline
            ├── ApprovalPanelPage.jsx  ← approve/reject interface
            ├── LabSchedulePage.jsx    ← weekly timetable viewer
            └── AllBookingsPage.jsx    ← admin table view
```

---

## 7. HOW TO RUN LOCALLY

### Option A — Docker Compose (Recommended, Zero Setup)

```bash
# 1. Clone / unzip the project
cd lab-booking-system

# 2. Create environment file
cp .env.example .env
# Edit .env if you need custom DB credentials or JWT secret

# 3. Start everything
docker-compose up --build

# Services:
#   Frontend  → http://localhost:80
#   Backend   → http://localhost:8080/api
#   PostgreSQL→ localhost:5432
```

The backend seeds demo users and labs automatically on first startup.

---

### Option B — Local Development (Hot Reload)

#### Prerequisites
- Java 21 (e.g. via SDKMAN: `sdk install java 21.0.3-tem`)
- Maven 3.9+
- Node.js 20+
- PostgreSQL 15+ running locally

#### Step 1 — Start PostgreSQL
```bash
psql -U postgres -c "CREATE DATABASE lab_booking;"
```

#### Step 2 — Run Backend
```bash
cd backend

# Set environment variables (or edit application.properties)
export DB_URL=jdbc:postgresql://localhost:5432/lab_booking
export DB_USERNAME=postgres
export DB_PASSWORD=postgres

mvn spring-boot:run
# → API available at http://localhost:8080/api
# → Demo data seeded automatically
```

#### Step 3 — Run Frontend
```bash
cd frontend

npm install
npm run dev
# → App available at http://localhost:5173
# → Proxies /api/* to backend automatically (see vite.config.js)
```

#### Step 4 — Login
Open http://localhost:5173 and use any demo credential:
- Username: `student1` / Password: `password123`
- Username: `principal` / Password: `password123`

---

### Option C — Build Production Artifacts

```bash
# Backend JAR
cd backend && mvn clean package -DskipTests
# Output: target/lab-booking-1.0.0.jar

# Frontend static build
cd frontend && npm run build
# Output: dist/ folder (serve with any static server)
```

---

## 8. TESTING THE APPROVAL WORKFLOW

### Quick end-to-end test:

```bash
# 1. Login as student
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student1","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# 2. Get available labs
curl -s http://localhost:8080/api/labs \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 3. Submit a booking
curl -s -X POST http://localhost:8080/api/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requestType": "EXTRA_CLASS",
    "bookingDate": "2025-12-01",
    "startTime": "14:00",
    "endTime": "15:00",
    "purpose": "Test booking",
    "labIds": [1],
    "division": "TE-A"
  }' | python3 -m json.tool

# 4. Login as Professor and approve
PROF_TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"prof_sharma","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# 5. Get pending approvals
curl -s http://localhost:8080/api/bookings/pending-approvals \
  -H "Authorization: Bearer $PROF_TOKEN" | python3 -m json.tool

# 6. Approve (replace 1 with actual booking ID)
curl -s -X POST http://localhost:8080/api/bookings/1/approve \
  -H "Authorization: Bearer $PROF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"APPROVED","comments":"Approved by professor"}' | python3 -m json.tool
# → Status changes to APPROVED (auto-approve rule triggered)
```

---

## 9. EMAIL NOTIFICATIONS

Email is disabled by default (`MAIL_ENABLED=false`). To enable:

1. Create a Gmail App Password:
   - Google Account → Security → 2-Step Verification → App Passwords
   - Generate a password for "Mail"

2. Set env vars:
```bash
MAIL_ENABLED=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-16-char-app-password
```

Emails sent:
- On booking submission → requester + first-level approvers
- On approval/rejection → requester

---

## 10. TECH DECISIONS & NOTES

| Decision | Reason |
|----------|--------|
| JWT stateless auth | Scales horizontally; no session storage needed |
| Hierarchical approval engine in `BookingService` | All rules in one place, easy to extend |
| `@EnableAsync` for email | Approvals don't block on SMTP timeouts |
| Manual MapperUtil vs MapStruct | Simpler debugging, no annotation processor conflicts |
| `docker-compose` health checks | Backend waits for Postgres to be ready |
| Vite proxy for dev | No CORS issues in local dev |
| `DataSeeder` with `count() == 0` guard | Idempotent seeding; safe to restart |
