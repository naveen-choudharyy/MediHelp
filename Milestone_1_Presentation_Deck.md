# BENNETT UNIVERSITY — SCHOOL OF COMPUTER SCIENCE ENGINEERING AND TECHNOLOGY
## CSET400C – CAPSTONE PROJECT (ACADEMIC SESSION 2026–27)
### MILESTONE-1 PRESENTATION DECK (SIMPLIFIED & BASIC GUIDE)

**Project Title:** MediConnect: Online Doctor Consultation Web Platform  
**Target Duration:** 8–10 Minutes  
**Panel Members:** Course Coordinator (Dr. Jabir Ali) & Faculty Evaluation Panel  

---

## SLIDE 1: TITLE & TEAM INTRODUCTION
* **Project Name:** MediConnect
* **Subtitle:** Online Doctor Consultation Platform with Conflict-Free Booking & Direct Video Calls
* **Category:** CSET400C Capstone Project — Milestone-1: Proposal & Requirements
* **Team Members (B.Tech CSE 7th Sem):**
  * Naveen Choudhary — Lead Developer (Architecture & Backend)
  * Member 2 — Full-Stack Developer (Database & API)
  * Member 3 — Frontend Developer (UI/UX & Testing)
* **Course Coordinator:** Dr. Jabir Ali
* **Speaker Script (45 Seconds):**
  > *"Good morning respected panel members and Dr. Jabir Ali. Today our team presents Milestone 1 of our capstone project, MediConnect. MediConnect is a simple, browser-based telemedicine web application that allows patients to search for doctors, book appointments without double-booking clashes, and attend secure, direct video consultations directly in their browser without expensive third-party video charges."*

---

## SLIDE 2: THE PROBLEM & MOTIVATION
* **Key Statistics:**
  * **Doctor Shortage (1:1,456):** Below WHO standard of 1:1,000.
  * **Urban-Rural Divide (74% vs 28%):** Most specialists work in big cities, while 65%+ people live in smaller towns and villages.
  * **₹0 Video Goal:** Commercial video APIs (Twilio/Agora) charge heavy per-minute fees. We use free direct browser video.
* **Core Problems Solved:**
  * Rural patients spend whole days traveling and lose wages for simple 10-minute checkups.
  * Generic video apps like WhatsApp and Zoom do not have appointment booking, prescriptions, or payment records.
  * Simultaneous bookings often create double-booking errors.
* **Speaker Script (1 Minute):**
  > *"In India, reaching specialist doctors is hard for people in smaller towns. Traveling to cities costs money and time. During emergencies or routine follow-ups, clinics often use WhatsApp or Zoom, but these apps have no doctor schedules, no saved prescriptions, and no payment tracking. On the other hand, commercial telemedicine apps charge high per-minute video fees. MediConnect provides a simple, direct website where patients book open slots, talk to doctors on free browser video, and get saved prescriptions."*

---

## SLIDE 3: UN SUSTAINABLE DEVELOPMENT GOALS (SDG)
* **SDG 3 (Good Health & Well-Being):** Allows patients to consult verified doctors from home, reducing travel hassle and clinic overcrowding.
* **SDG 10 (Reduced Inequalities):** Gives patients in rural areas equal access to top city doctors at low cost.
* **SDG 9 (Industry & Innovation):** Runs directly in any web browser on standard mobile 4G internet without downloading heavy apps.
* **Speaker Script (45 Seconds):**
  > *"Our project supports three UN Sustainable Development Goals: SDG 3 by improving access to healthcare, SDG 10 by reducing the healthcare gap between urban and rural areas, and SDG 9 by using lightweight, browser-based web technology that works on normal smartphones and 4G networks."*

---

## SLIDE 4: LITERATURE REVIEW & BACKGROUND RESEARCH
* **Telemedicine Effectiveness (Bashshur et al., 2020):** Video consultations achieve over 90% diagnostic accuracy for routine care and follow-ups.
* **WebRTC on Mobile Networks (Johnston et al., 2021):** WebRTC adjusts video quality automatically to keep audio clear even on slower mobile networks.
* **Conflict-Free Scheduling (Gupta & Sharma, 2022):** Database index checks on Doctor + Date + Slot prevent double bookings efficiently.
* **Stateless Authentication (Al-Janabi et al., 2023):** Token-based login (JWT) keeps patient and doctor accounts secure.
* **Indian Telemedicine Guidelines (MoHFW / NHA, 2023):** Mandates verified doctor profiles and digital prescription records.
* **Speaker Script (1 Minute):**
  > *"Research confirms that telemedicine is effective for routine care. Studies show WebRTC handles changing mobile network speeds by keeping audio stable. Furthermore, using compound database indexing guarantees that two patients cannot book the same slot at the same time. Lastly, our design follows national digital health guidelines by saving digital prescriptions for every visit."*

---

## SLIDE 5: COMPARISON WITH EXISTING SYSTEMS
| Feature | Commercial (Practo) | Video Apps (Zoom/Meet) | MediConnect (Our System) |
| :--- | :--- | :--- | :--- |
| **Video Calling** | Cloud Relay (Costly) | Cloud Relay (Generic) | **Direct WebRTC (P2P, Zero relay fee)** |
| **Video Bandwidth Cost** | High per-minute fee | Paid monthly host | **₹0 (Direct browser-to-browser)** |
| **Double-Booking Check** | Proprietary | None (Manual) | **Automatic Database Check** |
| **In-Call Prescriptions** | Separate Tab | None | **Live Notes Built Into Call** |
| **App Download** | Mandatory App | Mandatory App/Client | **Zero Install (Opens in Browser)** |
* **Speaker Script (1 Minute):**
  > *"Compared to Practo, which takes large commissions and charges high fees, or Zoom, which has no medical booking features, MediConnect offers a complete, simple web solution with zero video streaming costs and built-in clinical notes."*

---

## SLIDE 6: USER WORKFLOWS (PATIENT & DOCTOR)
* **Patient Flow:**
  1. Sign Up & Login: Quick registration.
  2. Search Doctor: Filter by specialty and consultation fee.
  3. Select Time Slot: Choose an available time.
  4. Pay Fee: Pay doctor fee securely via Razorpay (UPI / Card).
  5. Join Video Call: Click 'Join Call' in browser at appointment time.
  6. View Prescription: See doctor's diagnosis and notes in history.
* **Doctor Flow:**
  1. Register Profile: Add qualification, specialty, and visit fee.
  2. Set Availability: Choose available working days and hours.
  3. View Appointments: Check upcoming booked patient visits.
  4. Start Consultation: Join encrypted video room with patient.
  5. Live Clinical Notes: Type notes and advice during the call.
  6. Mark Complete: Prescription auto-saved to patient record.
* **Speaker Script (1 Minute):**
  > *"Our user flows are kept very simple. Patients search for doctors, book a slot, pay online, join the video call, and view their prescription. Doctors set their working hours, view booked patients, conduct the video call, and type live medical notes that save directly to the database."*

---

## SLIDE 7: SYSTEM REQUIREMENTS
* **Functional Requirements (Features):**
  * Separate login and signup for Patients and Doctors.
  * Doctor search with filters for specialty, fee, and experience.
  * Doctor availability manager to set weekly working hours.
  * Smart booking logic that blocks already-booked slots.
  * Razorpay payment gateway for UPI and debit/credit cards.
  * 1-on-1 direct video and audio calling using WebRTC.
  * In-call notes console for doctor prescriptions.
  * Appointment history for past consultations.
* **Non-Functional Requirements (Performance & Security):**
  * Sub-250ms video/audio latency for smooth conversation.
  * Encrypted direct video streams; passwords hashed with bcrypt.
  * Zero app install needed; works across Chrome, Safari, Edge, Firefox.
  * Fast API response under 500ms.
* **Speaker Script (1 Minute):**
  > *"The system requirements cover essential functionality and reliability. Functionally, it handles authentication, doctor discovery, booking, payments, video calls, and prescriptions. Non-functionally, it ensures low video latency under 250ms, fast page response under 500ms, and complete privacy."*

---

## SLIDE 8: SYSTEM ARCHITECTURE
* **1. Frontend Client (React 19 + Vite):** Fast, responsive single-page web app for mobile and desktop; handles camera and mic.
* **2. Backend & Signaling (Node.js + Express + Socket.IO):** REST API for login, search, booking, and payments. Socket.IO coordinates call connection between users.
* **3. Database & Media (MongoDB + WebRTC):** MongoDB stores user profiles, bookings, and prescriptions. WebRTC streams video directly between browsers without any intermediate video server.
* **Speaker Script (1 Minute):**
  > *"Our architecture consists of three clean layers: A React frontend that runs in any browser, a Node.js and Express backend with Socket.IO to manage bookings and connect calls, and MongoDB for database storage. The video stream flows directly between patient and doctor using WebRTC, eliminating server bandwidth costs."*

---

## SLIDE 9: CONFLICT-FREE BOOKING LOGIC
* **Step 1: Standardize Date & Time:** Incoming dates are normalized to UTC midnight so time zones do not cause errors.
* **Step 2: Check Doctor's Availability:** Server confirms that the doctor is actually available on the chosen day and time.
* **Step 3: Instant Database Check:** Server queries MongoDB to check if an active booking already exists for Doctor + Date + Slot.
* **Step 4: Immediate Decision:** If the slot is already taken, it rejects the request instantly with an error. If free, the slot is confirmed.
* **Speaker Script (1 Minute):**
  > *"To ensure no double bookings occur, our backend uses a 4-step check: it standardizes the appointment date, verifies the doctor's working schedule, checks existing bookings in MongoDB, and instantly blocks any conflicting reservation."*

---

## SLIDE 10: FEASIBILITY STUDY & COST ANALYSIS
* **Technical Feasibility:** Works natively in 98%+ of global browsers; works smoothly over standard 4G mobile internet.
* **Operational Feasibility:** Zero software download needed; accessible to any user with a phone or computer browser.
* **Cost Comparison (1,000 Consultations / month):**
  * Commercial Video SDKs (Twilio / Agora): ₹25,000 – ₹50,000 / month.
  * MediConnect P2P Model: ₹0 video streaming fee.
  * Total Server & Database Cost: ~₹2,500 – ₹3,500 / month.
  * Over 90% cost savings for clinics and doctors.
* **Speaker Script (1 Minute):**
  > *"Our feasibility study confirms the project is practical and highly cost-effective. Because video streams directly between client browsers, clinics avoid paying high per-minute cloud fees, reducing total monthly costs from ₹30,000 down to around ₹3,000 for standard server hosting."*

---

## SLIDE 11: PROJECT RISKS & SOLUTIONS
* **Risk 1 (Slow internet in rural areas):** WebRTC automatically lowers video resolution to keep voice clear and prevent call drops.
* **Risk 2 (Simultaneous booking collisions):** Fast database check rejects duplicate requests immediately.
* **Risk 3 (Unauthorized access to call):** Only the verified patient and doctor for that specific appointment can enter the room.
* **Risk 4 (Payment drops):** Backend verifies Razorpay signature before confirming appointment.
* **Speaker Script (45 Seconds):**
  > *"We have simple, proactive solutions for key risks: adaptive video streaming for slow connections, database locks to prevent double bookings, room authentication to ensure privacy, and signature verification for secure payments."*

---

## SLIDE 12: ROADMAP & CONCLUSION
* **Milestone 0 (Complete):** Problem statement approved, team formed, schema designed.
* **Milestone 1 (Current Evaluation):** Project proposal, requirements, booking logic, and Razorpay integration.
* **Milestone 2 (Target: 23 Nov 2026):** Working MVP with WebRTC video calling and live in-call clinical notes.
* **Final Evaluation (End-Semester):** End-to-end testing, live working demo, and final project report.
* **Summary:** Affordable, browser-based telemedicine with free direct video calls and conflict-free booking.
* **Speaker Script (30 Seconds):**
  > *"To conclude, MediConnect is a practical, low-cost telemedicine solution designed to make healthcare accessible. Milestone 1 goals are complete, and we are on track for Milestone 2. Thank you Dr. Jabir Ali and respected panel members. We welcome your questions."*
