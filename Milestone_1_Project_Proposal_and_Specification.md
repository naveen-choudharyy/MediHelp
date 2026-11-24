# BENNETT UNIVERSITY
### SCHOOL OF COMPUTER SCIENCE ENGINEERING AND TECHNOLOGY
#### CSET400C – CAPSTONE PROJECT (ACADEMIC SESSION 2026–27)

# MILESTONE-1: PROJECT PROPOSAL & REQUIREMENTS SPECIFICATION

### PROJECT DETAILS
* **Project Title:** MediConnect: Online Doctor Consultation Web Platform with Conflict-Free Booking and Direct Video Calls
* **Course Code:** CSET400C (Capstone Project)
* **Academic Session:** 2026–27 (Semester VII)
* **Lead Developer:** Naveen Choudhary (B.Tech CSE VII)
* **Team Members:** Member 2 (Full-Stack Engineer), Member 3 (Frontend & Testing Engineer)
* **Course Coordinator:** Dr. Jabir Ali
* **Submission Date:** 18 October 2026

---

## ABSTRACT
Healthcare delivery in India faces significant geographic and economic barriers. Most medical specialists practice in large cities, while over 65% of the population resides in rural and semi-urban communities. As a result, patients often travel long distances and lose daily wages simply to access routine follow-up consultations. While consumer video tools like WhatsApp and Zoom enable remote conversations, they lack doctor appointment scheduling, integrated prescription records, and secure payment handling. Conversely, commercial telehealth applications rely on third-party video streaming SDKs that charge high per-minute fees, making them unaffordable for independent clinics and small healthcare centers.

**MediConnect** is a simple, browser-native telemedicine platform developed on the MERN stack (MongoDB, Express.js, React 19, Node.js) with peer-to-peer WebRTC video communication. MediConnect enables patients to find verified doctors, book appointments without double-booking conflicts, make online payments via Razorpay, and join secure 1-on-1 video calls directly from their browser. Because video streams directly between client devices using WebRTC, ongoing media server bandwidth costs are zero. Doctors can document clinical notes and prescriptions directly during consultations, and patients can review their medical history anytime.

---

## 1. INTRODUCTION AND PROBLEM STATEMENT

### 1.1 Formal Problem Statement
> "To design, build, and evaluate an accessible and cost-effective telemedicine web platform that provides conflict-free doctor appointment booking, browser-based peer-to-peer video consultations, and digital clinical prescription notes without requiring expensive third-party video streaming services."

### 1.2 Healthcare Background and Challenges in India
1. **Shortage of Physicians:** India's doctor-to-population ratio is approximately 1:1,456, lower than the World Health Organization (WHO) recommended benchmark of 1:1,000.
2. **Urban-Rural Divide:** Over 74% of doctors and 85% of specialists practice in major cities, leaving rural and semi-urban areas underserved.
3. **Shortcomings of Generic Apps:** Using WhatsApp or Zoom lacks appointment scheduling, slot management, and digital medical records.
4. **High Third-Party Video Costs:** Commercial video SDKs (Twilio/Agora) charge per-minute fees ($0.004 to $0.015/min), making scaling costly for small clinics.

### 1.3 Project Objectives
* **Conflict-Free Booking:** Ensure no two patients can book the same doctor slot at the same time.
* **Zero-Cost Video Streaming:** Use WebRTC for direct browser-to-browser calls with no media relay fees.
* **Integrated Clinical Notes:** Allow doctors to write and save prescriptions during calls.
* **Secure Online Payments:** Enable easy consultation fee payments via Razorpay (UPI & cards).

---

## 2. UN SUSTAINABLE DEVELOPMENT GOALS (SDG) ALIGNMENT

* **SDG 3 (Good Health and Well-Being - Target 3.8):** Delivers accessible remote healthcare follow-ups to rural and semi-urban patients, reducing hospital travel and clinic overcrowding.
* **SDG 10 (Reduced Inequalities - Target 10.2):** Gives small-town patients equal access to top city medical specialists without bearing travel and lodging costs.
* **SDG 9 (Industry, Innovation, and Infrastructure - Target 9.c):** Operates on standard web browsers over everyday 4G cellular connections without requiring expensive app downloads or high-end devices.

---

## 3. LITERATURE REVIEW AND EXISTING SYSTEMS

### 3.1 Research Foundations
1. **Telemedicine Efficacy (Bashshur et al., 2020):** Video consultations achieve over 90% diagnostic accuracy for primary care and follow-ups.
2. **Adaptive Video Streaming (Johnston et al., 2021):** WebRTC automatically adjusts video resolution to protect voice clarity on weak 4G networks.
3. **Database Concurrency (Gupta & Sharma, 2022):** Compound index queries on Doctor + Date + Slot eliminate double bookings efficiently.
4. **Stateless Authentication (Al-Janabi et al., 2023):** JWT tokens provide secure separation of patient and doctor sessions.
5. **Indian Telemedicine Guidelines (MoHFW, 2020):** Mandates verified doctor profiles, patient consent, and structured prescription records.

### 3.2 System Comparison Matrix
| Feature | Commercial (Practo) | Video Apps (Zoom/Meet) | MediConnect (Our System) |
| :--- | :--- | :--- | :--- |
| **Video Calling** | Cloud Relay (Costly) | Cloud Relay (Generic) | **Direct WebRTC (P2P)** |
| **Media Bandwidth Cost** | High per-minute fee | Paid monthly host | **₹0 (Browser-to-Browser)** |
| **Double-Booking Check** | Proprietary | None (Manual) | **Automatic Database Check** |
| **In-Call Prescriptions** | Separate Tab | None | **Live Built-in Notes** |
| **Indian Payments** | Closed Wallet | None | **Integrated Razorpay** |
| **Installation** | Mandatory App | App / Software Client | **Zero (Runs in Browser)** |

---

## 4. STAKEHOLDER ANALYSIS & REQUIREMENTS

### 4.1 User Personas & Workflows
* **Patient Flow:** Register/Login -> Search doctors by specialty/fee -> Select open slot -> Pay via Razorpay -> Join WebRTC video call -> View doctor's prescription in history.
* **Doctor Flow:** Setup profile & fee -> Configure weekly working hours -> View booked appointments -> Conduct video call -> Type live prescription notes -> Mark complete.

### 4.2 Functional Requirements (FR)
* **FR-01 (Auth):** Secure login and registration for Patients and Doctors using bcrypt and JWT.
* **FR-02 (Doctor Search):** Filter doctors by specialty, fee, and experience.
* **FR-03 (Availability):** Doctors define custom working slots for each day of the week.
* **FR-04 (Conflict-Free Booking):** Automatically detects and prevents double bookings.
* **FR-05 (Payment):** Integrated Razorpay payment checkout for UPI and cards.
* **FR-06 (Dashboard):** Doctors review and manage appointment queues.
* **FR-07 (Signaling):** Socket.IO relays connection data for WebRTC setup.
* **FR-08 (Video Consultation):** 1-on-1 direct video/audio calling inside the browser.
* **FR-09 (Clinical Notes):** Doctors write diagnoses and prescriptions during calls.
* **FR-10 (History):** Patients access complete past visit records.

### 4.3 Non-Functional Requirements (NFR)
* **NFR-01 (Low Latency):** Sub-250ms audio/video latency.
* **NFR-02 (Privacy):** Direct peer-to-peer encrypted video feeds.
* **NFR-03 (Zero Install):** Compatible with Chrome, Safari, Firefox, and Edge.
* **NFR-04 (Reliability):** Automatic reconnection if network temporarily drops.
* **NFR-05 (Speed):** API and page response times under 500ms.
* **NFR-06 (Compliance):** Adheres to Indian Telemedicine Guidelines (2020).

---

## 5. TECHNOLOGY STACK SELECTION

* **Frontend:** React 19 + Vite + React Router v7 (Fast, responsive SPA).
* **Backend:** Node.js + Express.js (High concurrency, lightweight REST API).
* **Database:** MongoDB 7.0 + Mongoose (Flexible schedule documents and compound indexing).
* **Real-Time Signaling:** Socket.IO 4.7 (WebSocket room coordination).
* **Video/Audio Media:** WebRTC (Direct peer-to-peer browser communication; zero video server cost).
* **Authentication:** JWT + bcryptjs (Stateless, secure login).
* **Payments:** Razorpay Node.js SDK (UPI, Netbanking, Cards).

---

## 6. FEASIBILITY STUDY & COST ANALYSIS

### 6.1 Feasibility Summary
* **Technical:** WebRTC natively supported in 98%+ of global browsers; works smoothly on 4G cellular data.
* **Operational:** Zero software installation; patients simply open the web link.
* **Legal:** Follows Indian Telemedicine Practice Guidelines (2020) and DPDP Act (2023).

### 6.2 Monthly Cost Breakdown (1,000 Consultations / Month)
| Infrastructure Component | Commercial SDK Model | MediConnect P2P Model |
| :--- | :--- | :--- |
| Video Streaming Servers | ₹25,000 – ₹50,000 | **₹0 (Direct WebRTC)** |
| Web Application Hosting | ₹2,000 – ₹5,000 | **₹1,200 – ₹1,800** |
| Database Cluster (MongoDB) | ₹2,500 – ₹4,000 | **₹1,500 – ₹2,000** |
| Total Monthly Cost | **₹30,000 – ₹60,000** | **₹2,700 – ₹3,800 (~90% Savings)** |

---

## 7. SYSTEM SCOPE & RISK MANAGEMENT

### 7.1 Scope Boundaries
* **In-Scope:** User auth, doctor search, slot scheduling, Razorpay payments, WebRTC video calling, in-call prescription notes.
* **Out-of-Scope:** Emergency trauma care, narcotic prescription, hospital bed management, group video conferences.

### 7.2 Risks and Practical Mitigations
* **Slow Internet:** WebRTC automatically reduces video quality to keep voice clear.
* **Double Booking:** Database query rejects duplicate bookings instantly.
* **Unauthorized Access:** Only authenticated doctor and patient can enter the appointment video room.
* **Payment Verification Drop:** Server validates Razorpay cryptographic signature before booking confirmation.

---

## 8. SYSTEM ARCHITECTURE & METHODOLOGY

### 8.1 Three-Tier Architecture
1. **Frontend (React 19):** UI rendering and local camera/microphone controls.
2. **Backend (Node.js & Express):** REST API for auth, booking logic, and Socket.IO signaling.
3. **Database & Media:** MongoDB stores records; WebRTC streams direct video between users.

### 8.2 Conflict-Free Booking Steps
1. **Normalize Date:** Convert requested date to UTC midnight to avoid timezone shifts.
2. **Verify Schedule:** Check if doctor is available on that day and time.
3. **Database Query:** Check MongoDB for existing bookings with Doctor + Date + Slot.
4. **Confirm or Reject:** If taken, return error; if free, save and lock booking.

### 8.3 Sprint Roadmap
* **Sprint 1 (Aug 10 – Aug 24):** Milestone 0: Problem statement, initial schemas.
* **Sprint 2 (Aug 25 – Sep 14):** User auth, patient and doctor profiles.
* **Sprint 3 (Sep 15 – Oct 05):** Availability planner, doctor search, booking checks.
* **Sprint 4 (Oct 06 – Oct 18):** Milestone 1: Proposal, requirements, feasibility, Razorpay checkout.
* **Sprint 5 (Oct 19 – Nov 08):** WebRTC signaling, 1-on-1 video rooms, audio/video toggles.
* **Sprint 6 (Nov 09 – Nov 23):** Milestone 2: Live clinical notes persistence, MVP testing.
* **Sprint 7 (Nov 24 – End Sem):** Final Evaluation: End-to-end testing, final report, live demo.

---

## 9. EXPECTED DELIVERABLES

* **Milestone 1 (Current):** Approved proposal, system specification, and core booking engine.
* **Milestone 2 (Target: 23 Nov 2026):** Working WebRTC video consultation MVP with live notes.
* **Final Capstone:** Production-ready web application, 20–30 page final report, and live viva defense.

---

## 10. CONCLUSION
MediConnect provides a practical, low-cost telemedicine solution that connects patients and doctors directly. By eliminating expensive video streaming servers through WebRTC, preventing scheduling conflicts with smart database validation, and enabling live digital prescriptions, the platform makes quality medical consultations accessible and sustainable.

---

## REFERENCES
1. MoHFW, Government of India, "Telemedicine Practice Guidelines," Mar. 2020.
2. World Health Organization, "Global Strategy on Digital Health 2020–2025," 2021.
3. NHA, India, "Ayushman Bharat Digital Mission (ABDM) Strategy," 2023.
4. E. Rescorla, "Datagram Transport Layer Security (DTLS) 1.3," RFC 9147, 2018.
5. A. Johnston et al., "Taking WebRTC to the Next Level," *IEEE Comm. Mag.*, 2021.
6. R. L. Bashshur et al., "The Empirical Foundations of Telemedicine," *Telemed & e-Health*, 2020.
7. R. Gupta & M. Sharma, "Concurrency Control in Healthcare Informatics," *J. Med. Syst.*, 2022.
8. M. Al-Janabi et al., "Stateless Authentication in Web-Based EHR," *Comput. Biol. Med.*, 2023.
9. Ministry of Law & Justice, "Digital Personal Data Protection Act, 2023," *Gazette of India*, 2023.
10. MDN Web Docs, "WebRTC API Documentation," 2024.
