import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    # 16:9 Widescreen layout
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Professional clean color palette
    NAVY_DARK = RGBColor(15, 23, 42)       # #0F172A
    NAVY_PRIMARY = RGBColor(30, 58, 138)   # #1E3A8A
    TEAL_ACCENT = RGBColor(2, 132, 199)    # #0284C7
    EMERALD_GREEN = RGBColor(16, 185, 129) # #10B981
    AMBER_ORANGE = RGBColor(245, 158, 11)  # #F59E0B
    BG_LIGHT = RGBColor(248, 250, 252)     # #F8FAFC
    CARD_BG = RGBColor(255, 255, 255)      # #FFFFFF
    CARD_BORDER = RGBColor(226, 232, 240)  # #E2E8F0
    TEXT_DARK = RGBColor(15, 23, 42)       # #0F172A
    TEXT_MUTED = RGBColor(100, 116, 139)   # #64748B
    WHITE = RGBColor(255, 255, 255)
    RED_ACCENT = RGBColor(225, 29, 72)

    def set_bg(slide, color):
        bg = slide.background
        fill = bg.fill
        fill.solid()
        fill.fore_color.rgb = color

    def add_header(slide, title, category="CSET400C CAPSTONE PROJECT • MILESTONE 1"):
        box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(0.9))
        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        
        p0 = tf.paragraphs[0]
        p0.text = category.upper()
        p0.font.size = Pt(10)
        p0.font.bold = True
        p0.font.color.rgb = TEAL_ACCENT
        p0.font.name = "Arial"
        
        p1 = tf.add_paragraph()
        p1.text = title
        p1.font.size = Pt(22)
        p1.font.bold = True
        p1.font.color.rgb = NAVY_DARK
        p1.font.name = "Arial"

    def add_card(slide, left, top, width, height, bg_color=CARD_BG, border_color=CARD_BORDER):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = bg_color
        shape.line.color.rgb = border_color
        shape.line.width = Pt(1)
        return shape

    # =========================================================
    # SLIDE 1: TITLE SLIDE (Clean & Simple)
    # =========================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_bg(s1, NAVY_DARK)

    # Accent tag
    tag_box = s1.shapes.add_textbox(Inches(1.0), Inches(1.2), Inches(11.0), Inches(0.4))
    tf_tag = tag_box.text_frame
    p_tag = tf_tag.paragraphs[0]
    p_tag.text = "BENNETT UNIVERSITY • CSET400C CAPSTONE PROJECT"
    p_tag.font.size = Pt(12)
    p_tag.font.bold = True
    p_tag.font.color.rgb = TEAL_ACCENT

    # Main Title
    title_box = s1.shapes.add_textbox(Inches(1.0), Inches(1.7), Inches(11.0), Inches(1.2))
    tf_t = title_box.text_frame
    p_t = tf_t.paragraphs[0]
    p_t.text = "MediConnect"
    p_t.font.size = Pt(44)
    p_t.font.bold = True
    p_t.font.color.rgb = WHITE

    # Subtitle
    sub_box = s1.shapes.add_textbox(Inches(1.0), Inches(2.9), Inches(11.0), Inches(0.8))
    tf_sub = sub_box.text_frame
    p_sub = tf_sub.paragraphs[0]
    p_sub.text = "Online Doctor Consultation Platform with Conflict-Free Booking & Direct Video Calls"
    p_sub.font.size = Pt(18)
    p_sub.font.color.rgb = RGBColor(148, 163, 184)

    # Milestone Tag
    p_sub2 = tf_sub.add_paragraph()
    p_sub2.text = "Milestone-1: Project Proposal & Requirements Specification"
    p_sub2.font.size = Pt(14)
    p_sub2.font.bold = True
    p_sub2.font.color.rgb = TEAL_ACCENT

    # Team Card
    team_card = add_card(s1, Inches(1.0), Inches(4.2), Inches(6.8), Inches(2.5), bg_color=RGBColor(30, 41, 59), border_color=RGBColor(51, 65, 85))
    tf_team = team_card.text_frame
    tf_team.margin_left = tf_team.margin_top = Inches(0.3)
    p_th = tf_team.paragraphs[0]
    p_th.text = "PROJECT TEAM (7th SEMESTER B.TECH CSE)"
    p_th.font.size = Pt(12)
    p_th.font.bold = True
    p_th.font.color.rgb = TEAL_ACCENT
    
    members = [
        ("Naveen Choudhary", "Lead Developer (Architecture & Backend)"),
        ("Member 2", "Full-Stack Developer (Database & API)"),
        ("Member 3", "Frontend Developer (UI/UX & Testing)")
    ]
    for name, role in members:
        p_m = tf_team.add_paragraph()
        p_m.text = f"• {name}  —  {role}"
        p_m.font.size = Pt(12)
        p_m.font.color.rgb = WHITE

    # Coordinator Card
    coord_card = add_card(s1, Inches(8.1), Inches(4.2), Inches(4.2), Inches(2.5), bg_color=RGBColor(30, 41, 59), border_color=RGBColor(51, 65, 85))
    tf_coord = coord_card.text_frame
    tf_coord.margin_left = tf_coord.margin_top = Inches(0.3)
    p_ch = tf_coord.paragraphs[0]
    p_ch.text = "ACADEMIC COORDINATION"
    p_ch.font.size = Pt(12)
    p_ch.font.bold = True
    p_ch.font.color.rgb = TEAL_ACCENT

    p_c1 = tf_coord.add_paragraph()
    p_c1.text = "Course Coordinator:"
    p_c1.font.size = Pt(11)
    p_c1.font.color.rgb = RGBColor(148, 163, 184)
    
    p_c2 = tf_coord.add_paragraph()
    p_c2.text = "Dr. Jabir Ali"
    p_c2.font.size = Pt(15)
    p_c2.font.bold = True
    p_c2.font.color.rgb = WHITE

    p_c3 = tf_coord.add_paragraph()
    p_c3.text = "Submission Date: 18 October 2026\nWeight: 30 Marks"
    p_c3.font.size = Pt(11)
    p_c3.font.color.rgb = RGBColor(203, 213, 225)

    s1.notes_slide.notes_text_frame.text = (
        "Good morning respected evaluators and Dr. Jabir Ali. Today we present Milestone 1 of our capstone project, MediConnect. "
        "MediConnect is a simple, browser-based telemedicine web application that allows patients to easily book appointments "
        "and have secure, direct video consultations with verified doctors without expensive third-party video charges."
    )

    # =========================================================
    # SLIDE 2: THE PROBLEM (Simple & Clear)
    # =========================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_bg(s2, BG_LIGHT)
    add_header(s2, "Problem Statement & Background")

    # 3 Stat Cards
    c1 = add_card(s2, Inches(0.8), Inches(1.5), Inches(3.7), Inches(2.0))
    tf1 = c1.text_frame
    tf1.margin_top = tf1.margin_left = Inches(0.25)
    p = tf1.paragraphs[0]
    p.text = "1 : 1,456"
    p.font.size = Pt(30)
    p.font.bold = True
    p.font.color.rgb = RED_ACCENT
    p2 = tf1.add_paragraph()
    p2.text = "Doctor-Patient Ratio in India\nBelow WHO benchmark (1:1,000). Major shortage of specialists in smaller towns."
    p2.font.size = Pt(11)
    p2.font.color.rgb = TEXT_DARK

    c2 = add_card(s2, Inches(4.8), Inches(1.5), Inches(3.7), Inches(2.0))
    tf2 = c2.text_frame
    tf2.margin_top = tf2.margin_left = Inches(0.25)
    p = tf2.paragraphs[0]
    p.text = "74% vs 28%"
    p.font.size = Pt(30)
    p.font.bold = True
    p.font.color.rgb = AMBER_ORANGE
    p2 = tf2.add_paragraph()
    p2.text = "Doctor Urban-Rural Divide\n74% of doctors are in big cities, while 65%+ of the population lives in rural & semi-urban areas."
    p2.font.size = Pt(11)
    p2.font.color.rgb = TEXT_DARK

    c3 = add_card(s2, Inches(8.8), Inches(1.5), Inches(3.7), Inches(2.0))
    tf3 = c3.text_frame
    tf3.margin_top = tf3.margin_left = Inches(0.25)
    p = tf3.paragraphs[0]
    p.text = "₹0 Video Goal"
    p.font.size = Pt(30)
    p.font.bold = True
    p.font.color.rgb = EMERALD_GREEN
    p2 = tf3.add_paragraph()
    p2.text = "Eliminate Third-Party Fees\nExisting commercial video SDKs charge high recurring fees per minute. We use free direct browser video."
    p2.font.size = Pt(11)
    p2.font.color.rgb = TEXT_DARK

    # Simple Problem Points Box
    p_box = add_card(s2, Inches(0.8), Inches(3.8), Inches(11.733), Inches(3.1))
    tf_p = p_box.text_frame
    tf_p.margin_left = tf_p.margin_top = Inches(0.25)
    p = tf_p.paragraphs[0]
    p.text = "CORE CHALLENGES WE ARE SOLVING"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = NAVY_PRIMARY

    challenges = [
        "Long Travel & High Costs: Patients in remote towns travel hours and spend extra money just for 10-minute follow-ups.",
        "Consumer Apps Lack Medical Tools: WhatsApp and Zoom don't support doctor appointment booking, payment, or medical records.",
        "Double-Booking Clashes: Simultaneous bookings often lead to two patients reserving the exact same doctor slot.",
        "Our Solution: A simple web app where patients easily book slots, talk to doctors on free browser video, and get saved prescriptions."
    ]
    for ch in challenges:
        p_c = tf_p.add_paragraph()
        p_c.text = f"• {ch}"
        p_c.font.size = Pt(12)
        p_c.font.color.rgb = TEXT_DARK

    s2.notes_slide.notes_text_frame.text = (
        "In simple terms, patients in rural areas struggle to reach specialist doctors. When clinics try using WhatsApp or Zoom, "
        "they don't have appointment scheduling, prescriptions, or payment records. "
        "MediConnect gives them a complete, simple web platform: search doctor, book slot without clashes, video call in browser, and save prescription."
    )

    # =========================================================
    # SLIDE 3: UN SUSTAINABLE DEVELOPMENT GOALS (SDG)
    # =========================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_bg(s3, BG_LIGHT)
    add_header(s3, "UN Sustainable Development Goals (SDG) Alignment")

    sdg_cards = [
        ("SDG 3", "Good Health & Well-Being", "Universal Health Access",
         "Enables patients in remote areas to consult verified doctors from home, reducing travel fatigue and clinic crowding.",
         EMERALD_GREEN),
        ("SDG 10", "Reduced Inequalities", "Equal Medical Care",
         "Gives rural and small-town families the same access to top city specialists without heavy travel or wage-loss costs.",
         TEAL_ACCENT),
        ("SDG 9", "Industry & Innovation", "Lightweight Web Tech",
         "Runs in standard web browsers on mobile phones and 4G internet without downloading heavy apps or buying costly equipment.",
         NAVY_PRIMARY)
    ]

    for i, (tag, title, subtitle, desc, color) in enumerate(sdg_cards):
        card = add_card(s3, Inches(0.8 + i*4.0), Inches(1.6), Inches(3.733), Inches(5.1))
        tf = card.text_frame
        tf.margin_left = tf.margin_top = Inches(0.3)
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = tag
        p1.font.size = Pt(14)
        p1.font.bold = True
        p1.font.color.rgb = color

        p2 = tf.add_paragraph()
        p2.text = title
        p2.font.size = Pt(16)
        p2.font.bold = True
        p2.font.color.rgb = NAVY_DARK

        p3 = tf.add_paragraph()
        p3.text = subtitle
        p3.font.size = Pt(11)
        p3.font.bold = True
        p3.font.color.rgb = color

        p4 = tf.add_paragraph()
        p4.text = f"\n{desc}"
        p4.font.size = Pt(12)
        p4.font.color.rgb = TEXT_DARK

    s3.notes_slide.notes_text_frame.text = (
        "Our capstone directly supports 3 UN Sustainable Development Goals: "
        "SDG 3 by improving healthcare access, SDG 10 by reducing the urban-rural care gap, "
        "and SDG 9 by using open, browser-native web technology that runs on normal phones and 4G."
    )

    # =========================================================
    # SLIDE 4: LITERATURE REVIEW (Simple & Practical)
    # =========================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_bg(s4, BG_LIGHT)
    add_header(s4, "Literature Review & Research Foundation")

    lit_card = add_card(s4, Inches(0.8), Inches(1.5), Inches(11.733), Inches(5.3))
    tf = lit_card.text_frame
    tf.margin_left = tf.margin_top = Inches(0.3)
    tf.word_wrap = True

    p_h = tf.paragraphs[0]
    p_h.text = "WHAT PREVIOUS RESEARCH TELLS US"
    p_h.font.size = Pt(12)
    p_h.font.bold = True
    p_h.font.color.rgb = TEAL_ACCENT

    research_items = [
        ("Telemedicine Effectiveness (Bashshur et al., 2020)",
         "Studies prove over 90% diagnostic accuracy in routine and follow-up cases when video consultations are smooth and clear."),
        ("WebRTC on Mobile Networks (Johnston et al., 2021)",
         "WebRTC automatically adjusts video quality based on network speed, keeping voice crisp even on weak 4G cellular data."),
        ("Conflict-Free Scheduling (Gupta & Sharma, 2022)",
         "Using database index checks on Doctor + Date + Slot guarantees no double bookings without slowing down the server."),
        ("Patient Privacy & Authentication (Al-Janabi et al., 2023)",
         "Stateless token-based authentication (JWT) securely separates patient and doctor accounts with minimal server memory."),
        ("Indian Telemedicine Guidelines (NHA / MoHFW, 2023)",
         "Mandates verified doctor profiles, patient consent, and structured digital prescription records for every consultation.")
    ]

    for title, desc in research_items:
        p1 = tf.add_paragraph()
        p1.text = f"• {title}"
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = NAVY_PRIMARY

        p2 = tf.add_paragraph()
        p2.text = f"   {desc}"
        p2.font.size = Pt(11)
        p2.font.color.rgb = TEXT_DARK

    s4.notes_slide.notes_text_frame.text = (
        "We reviewed existing research to make our design practical: "
        "Video calls work well for routine care, WebRTC handles variable 4G speeds, "
        "database index checks prevent double bookings, and Indian guidelines require saving digital prescriptions."
    )

    # =========================================================
    # SLIDE 5: GAP ANALYSIS / COMPARISON (Simple Table)
    # =========================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_bg(s5, BG_LIGHT)
    add_header(s5, "Comparison with Existing Systems")

    t_card = add_card(s5, Inches(0.8), Inches(1.5), Inches(11.733), Inches(5.3))
    tf = t_card.text_frame
    tf.margin_left = tf.margin_top = Inches(0.3)
    p = tf.paragraphs[0]
    p.text = "HOW MEDICONNECT COMPARES WITH ALTERNATIVES"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = TEAL_ACCENT

    table_shape = s5.shapes.add_table(6, 4, Inches(1.0), Inches(2.1), Inches(11.333), Inches(4.3))
    table = table_shape.table
    table.columns[0].width = Inches(2.8)
    table.columns[1].width = Inches(2.6)
    table.columns[2].width = Inches(2.6)
    table.columns[3].width = Inches(3.333)

    headers = ["Feature", "Commercial (Practo)", "Video Apps (Zoom/Meet)", "MediConnect (Our Platform)"]
    for col_idx, text in enumerate(headers):
        cell = table.cell(0, col_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = NAVY_PRIMARY if col_idx < 3 else TEAL_ACCENT
        p = cell.text_frame.paragraphs[0]
        p.text = text
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = WHITE

    comparison_rows = [
        ("Video Consultation", "Cloud relay (costs high)", "Cloud relay (generic)", "Direct WebRTC (P2P, Zero relay fee)"),
        ("Recurring Video Cost", "High per-minute fees", "Paid monthly plan", "₹0 (Browser-to-browser stream)"),
        ("Double-Booking Protection", "Proprietary", "None (Manual)", "Automatic database conflict check"),
        ("In-Call Medical Notes", "Separate window", "None", "Built-in live notes during the call"),
        ("App Installation", "Must download app", "Must install app/client", "Zero install (Runs in any browser)")
    ]

    for row_idx, row in enumerate(comparison_rows):
        for col_idx, val in enumerate(row):
            cell = table.cell(row_idx + 1, col_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = WHITE if (row_idx % 2 == 0) else RGBColor(241, 245, 249)
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.size = Pt(11)
            p.font.bold = (col_idx == 3 or col_idx == 0)
            p.font.color.rgb = NAVY_DARK if col_idx < 3 else TEAL_ACCENT

    s5.notes_slide.notes_text_frame.text = (
        "Compared to Practo, which takes big commissions, or Zoom, which has no medical booking or notes, "
        "MediConnect offers a lightweight, zero-cost video consultation flow that runs right inside the browser."
    )

    # =========================================================
    # SLIDE 6: USER WORKFLOWS (Patient & Doctor)
    # =========================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_bg(s6, BG_LIGHT)
    add_header(s6, "User Workflows (Patient & Doctor)")

    # Patient Card
    p_card = add_card(s6, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.3))
    tf1 = p_card.text_frame
    tf1.margin_left = tf1.margin_top = Inches(0.3)
    tf1.word_wrap = True

    p = tf1.paragraphs[0]
    p.text = "PATIENT WORKFLOW"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = TEAL_ACCENT

    p = tf1.add_paragraph()
    p.text = "Simple 6-Step Experience"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = NAVY_DARK

    patient_steps = [
        "1. Sign Up / Login: Create an account with name and phone/email.",
        "2. Find Doctor: Search by medical specialty, experience, and fee.",
        "3. Choose Slot: Select an open date and time slot.",
        "4. Pay Fee: Pay doctor fee securely via Razorpay (UPI / Card).",
        "5. Join Video Call: Click 'Join Call' in browser at appointment time.",
        "6. View Prescription: See doctor's advice and notes in history."
    ]
    for step in patient_steps:
        p = tf1.add_paragraph()
        p.text = step
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_DARK

    # Doctor Card
    d_card = add_card(s6, Inches(6.8), Inches(1.5), Inches(5.7), Inches(5.3))
    tf2 = d_card.text_frame
    tf2.margin_left = tf2.margin_top = Inches(0.3)
    tf2.word_wrap = True

    p = tf2.paragraphs[0]
    p.text = "DOCTOR WORKFLOW"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = EMERALD_GREEN

    p = tf2.add_paragraph()
    p.text = "Straightforward Schedule & Notes"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = NAVY_DARK

    doctor_steps = [
        "1. Register Profile: Add qualification, specialty, and visit fee.",
        "2. Set Availability: Choose available working days and hours.",
        "3. View Appointments: Check upcoming booked patient visits.",
        "4. Start Consultation: Join encrypted video room with patient.",
        "5. Live Clinical Notes: Type notes and advice during the call.",
        "6. Mark Complete: Prescription auto-saved to patient record."
    ]
    for step in doctor_steps:
        p = tf2.add_paragraph()
        p.text = step
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_DARK

    s6.notes_slide.notes_text_frame.text = (
        "Here are the two core user flows. For patients: search doctor, book slot, pay fee, join call, and see prescription. "
        "For doctors: set available hours, review appointments, conduct video call, type live notes, and mark visit complete."
    )

    # =========================================================
    # SLIDE 7: SYSTEM REQUIREMENTS (Functional & Non-Functional)
    # =========================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_bg(s7, BG_LIGHT)
    add_header(s7, "System Requirements")

    c_fr = add_card(s7, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.3))
    tf_fr = c_fr.text_frame
    tf_fr.margin_left = tf_fr.margin_top = Inches(0.3)
    tf_fr.word_wrap = True

    p = tf_fr.paragraphs[0]
    p.text = "FUNCTIONAL REQUIREMENTS (WHAT IT DOES)"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = TEAL_ACCENT

    frs = [
        "User Accounts: Secure login/signup for Patients and Doctors.",
        "Doctor Search: Filter doctors by specialty, fee, and experience.",
        "Availability Planner: Doctors set custom time slots for each day.",
        "Conflict-Free Booking: Automatically blocks duplicate slot bookings.",
        "Payment Processing: Integrated Razorpay for UPI and card checkout.",
        "Browser Video Calling: Direct 1-on-1 audio and video using WebRTC.",
        "In-Call Prescription: Doctors write clinical notes saved to MongoDB.",
        "Appointment History: Patients and doctors view past visit notes."
    ]
    for item in frs:
        p = tf_fr.add_paragraph()
        p.text = f"• {item}"
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_DARK

    c_nfr = add_card(s7, Inches(6.8), Inches(1.5), Inches(5.7), Inches(5.3))
    tf_nfr = c_nfr.text_frame
    tf_nfr.margin_left = tf_nfr.margin_top = Inches(0.3)
    tf_nfr.word_wrap = True

    p = tf_nfr.paragraphs[0]
    p.text = "NON-FUNCTIONAL REQUIREMENTS (PERFORMANCE)"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = EMERALD_GREEN

    nfrs = [
        "Low Latency: Video and audio delay kept under 250ms for natural talk.",
        "Privacy & Security: Encrypted direct video; passwords hashed safely.",
        "Zero Installation: Works on Chrome, Safari, Edge without extra apps.",
        "Fast Response: Web pages and booking requests respond under 500ms.",
        "High Reliability: Automatic reconnection if internet temporarily drops.",
        "Compliance: Follows Indian Telemedicine Practice Guidelines (2020)."
    ]
    for item in nfrs:
        p = tf_nfr.add_paragraph()
        p.text = f"• {item}"
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_DARK

    s7.notes_slide.notes_text_frame.text = (
        "Our requirements are divided into functional features and non-functional goals. "
        "Functionally, it covers registration, booking, payments, video calls, and prescriptions. "
        "Non-functionally, we ensure fast response under 500ms, low video latency, and data privacy."
    )

    # =========================================================
    # SLIDE 8: SYSTEM ARCHITECTURE (Simple 3 Tiers)
    # =========================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_bg(s8, BG_LIGHT)
    add_header(s8, "System Architecture")

    arch_card = add_card(s8, Inches(0.8), Inches(1.5), Inches(11.733), Inches(5.3))
    tf = arch_card.text_frame
    tf.margin_left = tf.margin_top = Inches(0.3)
    p = tf.paragraphs[0]
    p.text = "SIMPLE THREE-TIER WEB ARCHITECTURE"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = TEAL_ACCENT

    # 3 Column cards inside
    t1 = add_card(s8, Inches(1.2), Inches(2.2), Inches(3.4), Inches(4.2))
    tf1 = t1.text_frame
    tf1.margin_left = tf1.margin_top = Inches(0.2)
    p = tf1.paragraphs[0]
    p.text = "1. FRONTEND (CLIENT)"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = NAVY_PRIMARY
    t1_items = [
        "React 19 + Vite: Fast, modern UI",
        "React Router: Clean page navigation",
        "Simple Responsive CSS: Works on phone & desktop",
        "WebRTC Media API: Access camera & mic directly in browser"
    ]
    for it in t1_items:
        p = tf1.add_paragraph()
        p.text = f"• {it}"
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_DARK

    t2 = add_card(s8, Inches(4.9), Inches(2.2), Inches(3.7), Inches(4.2))
    tf2 = t2.text_frame
    tf2.margin_left = tf2.margin_top = Inches(0.2)
    p = tf2.paragraphs[0]
    p.text = "2. BACKEND & CALL SETUP"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = TEAL_ACCENT
    t2_items = [
        "Node.js & Express: REST APIs for auth & booking",
        "Socket.IO: Connects doctor & patient for call setup",
        "JWT Authentication: Secure login tokens",
        "Razorpay SDK: Verified payment checkout"
    ]
    for it in t2_items:
        p = tf2.add_paragraph()
        p.text = f"• {it}"
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_DARK

    t3 = add_card(s8, Inches(8.9), Inches(2.2), Inches(3.2), Inches(4.2))
    tf3 = t3.text_frame
    tf3.margin_left = tf3.margin_top = Inches(0.2)
    p = tf3.paragraphs[0]
    p.text = "3. DATABASE & VIDEO"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = EMERALD_GREEN
    t3_items = [
        "MongoDB: Stores users, slots, & notes",
        "Compound Index: Prevents double bookings",
        "Direct WebRTC Video: Direct browser-to-browser stream",
        "Zero Media Server: No per-minute video bandwidth bill"
    ]
    for it in t3_items:
        p = tf3.add_paragraph()
        p.text = f"• {it}"
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_DARK

    s8.notes_slide.notes_text_frame.text = (
        "The architecture is very simple: React runs in the browser, Node.js handles data and booking rules, "
        "MongoDB stores patient and doctor info, and WebRTC connects the video directly between the two users with zero video server cost."
    )

    # =========================================================
    # SLIDE 9: DOUBLE-BOOKING PREVENTION LOGIC
    # =========================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_bg(s9, BG_LIGHT)
    add_header(s9, "Conflict-Free Appointment Booking Logic")

    c_lock = add_card(s9, Inches(0.8), Inches(1.5), Inches(11.733), Inches(5.3))
    tf = c_lock.text_frame
    tf.margin_left = tf.margin_top = Inches(0.3)
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "HOW WE PREVENT TWO PATIENTS FROM BOOKING THE SAME SLOT"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = TEAL_ACCENT

    booking_steps = [
        ("Step 1: Standardize Date & Time",
         "The server normalizes appointment dates so different time zones don't cause confusion."),
        ("Step 2: Check Doctor's Availability",
         "The server checks if the doctor actually works on the requested day and time slot."),
        ("Step 3: Instant Database Check",
         "The system checks MongoDB for any existing booking with the same Doctor + Date + Slot. If already booked, it stops immediately."),
        ("Step 4: Confirm or Reject Instantly",
         "If the slot is taken, the patient gets a clear message: 'Slot already booked'. If free, the slot is locked and confirmed immediately.")
    ]

    for title, desc in booking_steps:
        p = tf.add_paragraph()
        p.text = f"• {title}"
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = NAVY_PRIMARY

        p = tf.add_paragraph()
        p.text = f"   {desc}"
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_DARK

    s9.notes_slide.notes_text_frame.text = (
        "Preventing double bookings is straightforward: when a patient picks a slot, "
        "the backend checks the doctor's working hours and queries the database. "
        "If a booking already exists, it is rejected immediately. If free, it is confirmed right away."
    )

    # =========================================================
    # SLIDE 10: FEASIBILITY & COST MODEL
    # =========================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_bg(s10, BG_LIGHT)
    add_header(s10, "Feasibility Study & Cost Analysis")

    f1 = add_card(s10, Inches(0.8), Inches(1.5), Inches(5.7), Inches(2.4))
    tf1 = f1.text_frame
    tf1.margin_left = tf1.margin_top = Inches(0.25)
    p = tf1.paragraphs[0]
    p.text = "TECHNICAL & OPERATIONAL FEASIBILITY"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = TEAL_ACCENT
    tech_points = [
        "Browser Support: WebRTC works natively in 98%+ of browsers (Chrome, Safari, Edge).",
        "No App Download: Patients open a link and join immediately without installing software.",
        "Simple Interface: Clear buttons for video on/off, mic mute, and prescription view."
    ]
    for pt in tech_points:
        p = tf1.add_paragraph()
        p.text = f"• {pt}"
        p.font.size = Pt(10)
        p.font.color.rgb = TEXT_DARK

    f2 = add_card(s10, Inches(6.8), Inches(1.5), Inches(5.7), Inches(2.4))
    tf2 = f2.text_frame
    tf2.margin_left = tf2.margin_top = Inches(0.25)
    p = tf2.paragraphs[0]
    p.text = "LEGAL & REGULATORY FEASIBILITY"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = EMERALD_GREEN
    legal_points = [
        "Telemedicine Guidelines (2020): Follows Indian rules for doctor identity and records.",
        "Patient Privacy (DPDP Act): Direct video is not recorded or stored on private cloud servers.",
        "Digital Prescriptions: Doctor consultation notes are saved in the patient's record."
    ]
    for pt in legal_points:
        p = tf2.add_paragraph()
        p.text = f"• {pt}"
        p.font.size = Pt(10)
        p.font.color.rgb = TEXT_DARK

    f3 = add_card(s10, Inches(0.8), Inches(4.1), Inches(11.733), Inches(2.7))
    tf3 = f3.text_frame
    tf3.margin_left = tf3.margin_top = Inches(0.25)
    p = tf3.paragraphs[0]
    p.text = "COST COMPARISON (FOR 1,000 DOCTOR CONSULTATIONS / MONTH)"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = NAVY_PRIMARY

    cost_points = [
        "Commercial Video SDKs (Twilio / Agora): ₹25,000 – ₹50,000 per month (charging per-minute fees).",
        "MediConnect Direct WebRTC: ₹0 video relay fees (browsers stream video directly).",
        "Total Monthly Server Cost: ~₹2,500 – ₹3,500 / month (only for basic Node.js hosting & MongoDB).",
        "Conclusion: MediConnect saves 90%+ in operational costs, making it sustainable for small clinics."
    ]
    for pt in cost_points:
        p = tf3.add_paragraph()
        p.text = f"• {pt}"
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_DARK

    s10.notes_slide.notes_text_frame.text = (
        "Our feasibility study shows the project is practical. WebRTC works on all modern browsers with zero app install. "
        "By streaming video directly between browsers, we reduce monthly operating costs from ₹30,000+ down to just ₹3,000 for server hosting."
    )

    # =========================================================
    # SLIDE 11: RISKS & MITIGATION
    # =========================================================
    s11 = prs.slides.add_slide(blank_layout)
    set_bg(s11, BG_LIGHT)
    add_header(s11, "Project Risks & Simple Solutions")

    risk_card = add_card(s11, Inches(0.8), Inches(1.5), Inches(11.733), Inches(5.3))
    tf = risk_card.text_frame
    tf.margin_left = tf.margin_top = Inches(0.3)
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "PRACTICAL RISK MANAGEMENT STRATEGIES"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = TEAL_ACCENT

    risks = [
        ("Risk: Slow internet connection in rural areas",
         "Solution: WebRTC automatically reduces video quality to make sure audio remains smooth without disconnecting."),
        ("Risk: Two patients booking the same slot simultaneously",
         "Solution: Fast database checks immediately reject the second request with a clear 'Slot Taken' alert."),
        ("Risk: Unauthorized people entering a doctor's call",
         "Solution: The call room only permits the verified logged-in patient and doctor for that appointment ID."),
        ("Risk: Payment confirmation failure",
         "Solution: The server checks the cryptographic signature from Razorpay before locking the booking.")
    ]

    for r_title, r_sol in risks:
        p = tf.add_paragraph()
        p.text = f"• {r_title}"
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = RED_ACCENT

        p = tf.add_paragraph()
        p.text = f"   {r_sol}"
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_DARK

    s11.notes_slide.notes_text_frame.text = (
        "We have identified 4 simple risks and practical solutions: "
        "WebRTC auto-adjusts for slow networks, database checks prevent double bookings, "
        "login tokens prevent unauthorized call access, and Razorpay signatures verify payments."
    )

    # =========================================================
    # SLIDE 12: ROADMAP & CONCLUSION
    # =========================================================
    s12 = prs.slides.add_slide(blank_layout)
    set_bg(s12, BG_LIGHT)
    add_header(s12, "Project Roadmap & Summary")

    c_road = add_card(s12, Inches(0.8), Inches(1.5), Inches(6.5), Inches(5.3))
    tf1 = c_road.text_frame
    tf1.margin_left = tf1.margin_top = Inches(0.3)
    tf1.word_wrap = True

    p = tf1.paragraphs[0]
    p.text = "MILESTONE ROADMAP & SPRINT SCHEDULE"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = TEAL_ACCENT

    roadmap = [
        ("Milestone 0 (Completed)", "Problem definition, group approval, database schema setup."),
        ("Milestone 1 (Current Evaluation)", "Proposal, requirements, booking validation logic, Razorpay checkout."),
        ("Milestone 2 (Target: 23 Nov 2026)", "Live WebRTC video call MVP, in-call clinical note persistence, end-to-end testing."),
        ("Final Defense (End-Semester)", "System performance checks, final 20-30 page report, live working demo.")
    ]
    for phase, detail in roadmap:
        p = tf1.add_paragraph()
        p.text = f"• {phase}"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = NAVY_PRIMARY
        p = tf1.add_paragraph()
        p.text = f"   {detail}"
        p.font.size = Pt(10)
        p.font.color.rgb = TEXT_DARK

    c_summary = add_card(s12, Inches(7.6), Inches(1.5), Inches(4.933), Inches(5.3), bg_color=NAVY_DARK)
    tf2 = c_summary.text_frame
    tf2.margin_left = tf2.margin_top = Inches(0.3)
    tf2.word_wrap = True

    p = tf2.paragraphs[0]
    p.text = "PROJECT SUMMARY"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = TEAL_ACCENT

    summary_pts = [
        "Simple, browser-native telemedicine platform.",
        "Free 1-on-1 video calls using WebRTC (no video server costs).",
        "Smart booking logic that prevents duplicate appointments.",
        "Digital prescriptions saved directly to patient records.",
        "Fully aligned with Milestone-1 criteria and university guidelines."
    ]
    for pt in summary_pts:
        p = tf2.add_paragraph()
        p.text = f"✓ {pt}"
        p.font.size = Pt(11)
        p.font.color.rgb = WHITE

    p_qa = tf2.add_paragraph()
    p_qa.text = "\nThank you Dr. Jabir Ali & Evaluators!\nOpen for Questions & Discussion."
    p_qa.font.size = Pt(12)
    p_qa.font.bold = True
    p_qa.font.color.rgb = TEAL_ACCENT

    s12.notes_slide.notes_text_frame.text = (
        "In summary, MediConnect provides an accessible and affordable telemedicine platform for patients and doctors. "
        "Milestone 1 foundations are in place, and we are ready to build the live video MVP for Milestone 2. "
        "Thank you Dr. Jabir Ali and respected panel members. We look forward to your questions."
    )

    output_path = "/Users/naveenchoudhary/Document-2/Healthcare Telemedicine Web Application/MediConnect_Milestone_1_Presentation.pptx"
    prs.save(output_path)
    print(f"Presentation saved successfully to: {output_path}")

if __name__ == "__main__":
    create_deck()
