# BENNETT UNIVERSITY — SCHOOL OF COMPUTER SCIENCE ENGINEERING AND TECHNOLOGY
## CSET400C – CAPSTONE PROJECT (ACADEMIC SESSION 2026–27)
### MILESTONE-1 VIVA-VOCE DEFENSE & FACULTY PANEL Q&A MASTER GUIDE

**Course Code:** CSET400C – Capstone Project  
**Course Coordinator:** Dr. Jabir Ali  
**Project Title:** MediConnect: Healthcare Telemedicine Web Application  
**Target Milestone:** Milestone-1 (Proposal, Requirements & Feasibility Defense)  

---

## 1. CORE TECHNICAL ARCHITECTURE QUESTIONS

### Q1: Why did you choose WebRTC instead of WebSockets, HTTP Live Streaming (HLS), or third-party video SDKs like Agora or Twilio?
**Candidate Answer:**
> *"WebSockets and HLS are client-server streaming protocols. If we used WebSockets for video, every single frame of 720p/1080p video would have to travel up to our Node.js server, be decoded, and relayed back down to the other client. That would consume massive server bandwidth (roughly 1.5 to 3 Mbps per video stream) and introduce 500ms to 2-second latency, making real-time clinical conversation impossible.*
>
> *Third-party SDKs like Agora or Twilio solve this, but they charge $0.004 to $0.015 per participant per minute. For 1,000 monthly 20-minute consultations, that results in recurring charges of $160 to $600 each month, making the platform unsustainable for charitable clinics or small practices.*
>
> *WebRTC is a native W3C/IETF browser standard that enables direct peer-to-peer audiovisual streaming encrypted with DTLS-SRTP. The server only handles lightweight JSON signaling (SDP offers, answers, and ICE candidates). Once the handshake is complete, media flows directly between the two client browsers over UDP. This keeps latency under 200ms and reduces our ongoing media infrastructure costs to zero."*

---

### Q2: What happens when two users are behind Symmetric NATs or restrictive firewalls? STUN fails in this scenario—how does MediConnect handle it?
**Candidate Answer:**
> *"STUN (Session Traversal Utilities for NAT) works by asking a public STUN server to reflect the client's public IP address and port mapping. This succeeds across Full Cone, Restricted Cone, and Port Restricted Cone NATs, which account for roughly 85% to 90% of standard domestic broadband and mobile cellular networks.*
>
> *However, behind a Symmetric NAT—common in corporate networks, university campuses, and certain enterprise firewalls—the NAT assigns a different port for every destination IP. In that scenario, direct peer-to-peer STUN resolution fails.*
>
> *In our Milestone-1 design and prototype, we use Google's public STUN servers for standard environments. For production scaling in our roadmap, we plan to deploy a lightweight open-source TURN (Traversal Using Relays around NAT) server using Coturn on a low-cost virtual machine. When ICE candidate gathering detects that direct P2P connection fails, the media automatically falls back to relaying through the TURN server over TLS port 443, ensuring call connectivity even on restrictive networks."*

---

### Q3: Explain the exact mechanism you engineered to prevent double bookings. What happens if two patients submit a booking for the same slot at the exact same millisecond?
**Candidate Answer:**
> *"We implemented a three-layer protection strategy in `appointmentController.js` and the `Appointment` schema:*
>
> 1. *Date Normalization:* All incoming appointment dates are normalized to midnight UTC (`00:00:00.000 UTC`). This removes client timezone discrepancies (for example, where an IST evening date might be parsed as a different UTC date).
> 2. *Atomic Availability Verification:* The server inspects the doctor's weekly availability array in `DoctorProfile` to confirm that the requested time slot (`startTime` and `endTime`) is officially offered for that specific day of the week.
> 3. *Compound Indexed Query & Database Constraints:* Before creating a record, the server queries:
>    ```javascript
>    Appointment.findOne({
>      doctor: doctorId,
>      appointmentDate: dateObj,
>      startTime: startTime,
>      status: { $in: ['pending', 'confirmed', 'completed'] }
>    });
>    ```
>    Backed by a compound index: `{ doctor: 1, appointmentDate: 1, startTime: 1 }`.
>
> *Under high-concurrency conditions where two requests arrive within milliseconds, we enforce a compound unique index constraint on the active booking tuple. The first write operation succeeds, while the second triggers a duplicate key error (code 11000) at the database layer, returning a clean 400 Bad Request error to the second user rather than creating a duplicate booking."*

---

### Q4: How does Socket.IO signaling secure access to consultation rooms? How do you prevent an unauthorized user from joining another patient's call?
**Candidate Answer:**
> *"We enforce room security at two distinct checkpoints in `server/socket/index.js`:*
>
> 1. *Connection Authentication Middleware:* Before any socket connection is accepted, our middleware verifies the JWT token provided in `socket.handshake.auth.token`. It decodes the user ID and attaches the authenticated user object directly to `socket.user`. If the token is invalid or expired, the connection is rejected immediately.
> 2. *Room-Join Authorization Check:* When a client emits `join-room` with an `appointmentId`, the server does not simply join the socket to that room. Instead, it queries the `Appointment` document in MongoDB and verifies:
>    ```javascript
>    const isPatient = appointment.patient.toString() === socket.user._id.toString();
>    const isDoctor = appointment.doctor.toString() === socket.user._id.toString();
>    ```
>    If both checks evaluate to false, the server logs an unauthorized access attempt, refuses to join the socket to `appointment_<id>`, and emits an explicit `error-msg` event to the caller. This ensures only the assigned patient and doctor can access the signaling channel."*

---

## 2. HEALTHCARE DOMAIN, LEGAL & ETHICAL QUESTIONS

### Q5: What Indian laws and healthcare regulations govern telemedicine, and how does MediConnect comply with them?
**Candidate Answer:**
> *"Telemedicine in India is primarily governed by the Telemedicine Practice Guidelines issued on March 25, 2020, by the Ministry of Health and Family Welfare (MoHFW) alongside NITI Aayog, as well as the Digital Personal Data Protection (DPDP) Act of 2023.*
>
> *Our platform complies with these standards across several key areas:*
> 1. *Practitioner Verification:* Doctors must register with verifiable professional credentials, qualifications, and specializations, ensuring only Registered Medical Practitioners (RMPs) offer care.
> 2. *Patient Identification & Explicit Consent:* The guidelines require verifying patient identity and capturing consent. By requiring patient registration and having the patient initiate the booking request, explicit consent is established before any consultation occurs.
> 3. *Mandatory Digital Records:* The guidelines require doctors to document clinical notes, diagnoses, and prescriptions for every remote consultation. In MediConnect, the consultation room includes a built-in clinical notes console that saves records directly to the database when the session finishes, allowing patients to review their history at any time.
> 4. *Data Privacy & Minimization:* Under the DPDP Act, platforms must collect only necessary data. By using peer-to-peer WebRTC streaming, video and audio are not recorded or stored on our servers, avoiding unnecessary storage of sensitive patient interactions."*

---

### Q6: Can a doctor prescribe any medication through MediConnect under Indian guidelines?
**Candidate Answer:**
> *"No. The Telemedicine Practice Guidelines explicitly categorize medications into four schedules:*
> * *List O:* Over-the-counter (OTC) medications (paracetamol, cough lozenges, antacids, ORS) — permitted in any teleconsultation.
> * *List A:* First-consultation medicines for specific ailments or renewal of chronic medications (e.g., anti-hypertensives, asthma inhalers) — permitted via video consultations.
> * *List B:* Add-on medications for chronic illnesses under ongoing management.
> * *Prohibited List:* Schedule X drugs (narcotics, sedatives, psychotropics like alprazolam or tramadol) — strictly prohibited in any teleconsultation.
>
> *In our project scope, we explicitly define emergency trauma triage and Schedule X drug prescriptions as Out-of-Scope system boundaries to maintain clinical and regulatory compliance."*

---

## 3. DATABASE & ENGINEERING METHODOLOGY QUESTIONS

### Q7: Why choose MongoDB over PostgreSQL or MySQL, given that appointments and users naturally have relational structures?
**Candidate Answer:**
> *"While relational models handle rigid tabular data well, MongoDB provides practical advantages for our specific use case:*
> 1. *Flexible Availability Schedules:* A doctor's availability varies widely throughout the week (different days, multiple split shifts). In SQL, this requires multiple normalized tables (`doctors`, `weekly_days`, `time_slots`) joined together for every query. In MongoDB, availability is naturally represented as an embedded array of subdocuments within `DoctorProfile`, allowing full retrieval in a single query.
> 2. *Clinical Notes & Medical History:* Patient medical histories and consultation notes vary from simple strings to rich structured text. MongoDB handles these variable structures cleanly without complex schema migrations.
> 3. *Targeted Indexing:* Mongoose handles compound indexes on `{ doctor: 1, appointmentDate: 1, startTime: 1 }` efficiently, giving us the performance needed for atomic conflict checks without database-wide table locks."*

---

### Q8: What is your team's division of responsibilities, and how do you ensure consistent individual contributions?
**Candidate Answer:**
> *"Our responsibilities are clearly divided across the three team members:*
> * *Naveen Choudhary (Lead Developer & System Architect):* Responsible for overall system architecture, WebRTC peer connection management, Socket.IO signaling controllers, atomic double-booking prevention, and Razorpay payment integration.
> * *Team Member 2 (Backend & Database Engineer):* Responsible for MongoDB schema design, JWT authentication middleware, REST API route handlers, doctor availability planners, and query optimization.
> * *Team Member 3 (Frontend & QA Engineer):* Responsible for React component design, UI responsive layouts, client routing, WebRTC media stream binding and camera/mic controls, and end-to-end integration testing.*
>
> *Progress is tracked through our Git version control commit logs, demonstrating individual contributions across all milestones."*

---

## 4. MILESTONE ROADMAP & NEXT STEPS

### Q9: What is the exact expected deliverable for Milestone-2, and how will you validate it?
**Candidate Answer:**
> *"For Milestone-2 (due 23 November 2026), our deliverables include:*
> 1. *Demonstrable Minimum Viable Product (MVP):* A fully functional end-to-end teleconsultation workflow operating across two separate physical browsers or devices.
> 2. *Working Media Channel:* Successful WebRTC peer-to-peer audio-video streaming with in-call mute, unmute, and camera toggle controls.
> 3. *Live Clinical Note Authoring:* A responsive in-call notes panel that writes clinical observations directly to MongoDB when the consultation concludes.
> 4. *Validation Evidence:* Comprehensive test cases covering double-booking rejection, unauthorized socket room access, and WebRTC connection stability across varying network conditions."*

---
*End of Milestone-1 Viva-Voce Defense Master Guide*
