# ARCHITECTURE.MD: PathoAI Revenue Recovery Engine

## 1. Executive Summary & Intent
**Product:** PathoAI (2026 Clinical Compliance & Revenue Recovery).
**Objective:** Solve the 2026 CMS 2.5% pathology pay-cut by automating the documentation required for AI-assisted CPT billing (Codes 0596T-0763T).
**Aesthetic:** GCP-grade Enterprise. High density, zero-glow, Slate-950 background, Emerald-600 accents, 1px solid borders.

---

## 2. Tech Stack
- **Frontend:** Next.js 14+, TypeScript, Tailwind CSS, Shadcn/UI, Lucide Icons.
- **Backend:** Python FastAPI (Uvicorn).
- **AI Brain:** 
  - **Primary:** Gemini 3 Pro (`gemini-3-pro-latest`) for complex billing-regulatory reasoning.
  - **Secondary:** Gemini 3 Flash (`gemini-3-flash-latest`) for real-time UI suggestions and OCR.
  - **API Key:** Loaded from `GEMINI_API_KEY` in `.env` file.
  - **Output Format:** All AI outputs must be strictly JSON-formatted for backend parsing.
- **Data Persistence:** PostgreSQL (or local JSON for the 15-day MVP).
- **PDF Engine:** ReportLab (Python) for automated Audit Reports.

---

## 3. UI/UX Specification (The "GCP" Refactor)
### Layout: 3-Pane Fixed System
- **Left Sidebar (Width: 18%):** `CaseQueue`. Fixed height `100vh`. No global scroll. Individual item cards with subtle `border-slate-800`.
- **Center Pane (Width: 55%):** `MainViewer`. Floating controls are prohibited. Use a docked bottom bar for Pan/Zoom/Rotate.
- **Right Sidebar (Width: 27%):** `RevenueAgent`. Fixed height `100vh`. 
    - **Header:** Financial Summary (Base vs. Recovered).
    - **Body:** Monospaced Clinical Justification block.
    - **Footer:** Fixed "Verify & Document" button (Solid Emerald-600).

### Typography & Rules
- **Font:** Inter (UI), Geist Mono (Numbers/CPT Codes).
- **Sizes:** Body `text-sm` (14px), Data `text-xs` (12px).
- **Borders:** `1px solid #1e293b` (Slate-800). Remove all `shadow-lg` and `box-shadow`.
- **Radii:** Standardize `border-radius` to `4px` (small/professional). No large rounded corners.
- **Spacing:** Tight spacing (`p-2` instead of `p-6`). Enterprise UI is tight, not airy.
- **Colors:** 
  - Revenue: Flat `#10b981` (Emerald-600) for "Recovered" amounts. No glowing neons.
  - Backgrounds: Base `slate-950`, Cards `slate-900`.
- **Eliminate:** All shadows, neon glows, and gradients. Use flat solid colors.

---

## 4. Backend Logic & AI Workflow
### API Endpoint: `POST /api/analyze`
1. **Input:** Slide image path/ID.
2. **Action:** Calls Gemini 3 Pro to extract 2026 CPT codes and "Audit Justification."
3. **Returns:** JSON mapping findings to revenue delta.
4. **Model:** `gemini-3-pro-latest`
5. **Output Format:** Strictly JSON-formatted for backend parsing.

### API Endpoint: `POST /api/document`
1. **Input:** Pathologist's "Confirm" click event.
2. **Action:** Generates a timestamped record in the local DB.

### API Endpoint: `GET /api/export-pdf`
1. **Action:** Generates the "Audit Shield" PDF using ReportLab.
2. **PDF Content:** 
   - PathoAI Official Header.
   - Timestamped AI findings with Confidence scores.
   - Pathologist verification log.
   - The "Audit Shield" text block for insurance adjusters.

---

## 5. Development Tasks (For Cursor/Antigravity)

### Task 1: Refactor UI Components
- [ ] Clean up `layout.tsx` to enforce the 3-pane fixed grid.
- [ ] Refactor `RevenueAgent.tsx` to remove the "Matrix/Glow" effects and implement the GCP module style.
- [ ] Standardize typography to `Inter` 14px.

### Task 2: Gemini API Orchestration
- [ ] Create `services/billing_agent.py` in FastAPI.
- [ ] Implement Gemini 3 Pro (`gemini-3-pro-latest`) call using the following system instruction:
  > "Act as a 2026 CMS Compliance Officer. Your goal is to map pathology features to billable CPT codes (0596T-0763T) and provide a 3-sentence clinical justification for an audit. Return strictly JSON format."
- [ ] Load `GEMINI_API_KEY` from environment variables (`.env` file).
- [ ] Use Gemini 3 Flash (`gemini-3-flash-latest`) for fast UI interactions and OCR.

### Task 3: The Audit PDF Shield
- [ ] Create `services/pdf_generator.py`.
- [ ] Design a professional, clinical-grade PDF template.
- [ ] Connect the "Verify & Document" button to trigger this PDF download.

### Task 4: Interactive Verification
- [ ] Implement the "Point-to-Verify" logic. The user must click a specific "Complexity Indicator" in the right sidebar to unlock the "Verify" button. (This is our legal requirement for 'Human-in-the-loop').

---

## 6. Business Logic Context (The "Why")
- **The Problem:** Labs are losing 2.5% revenue in 2026.
- **The Solution:** We capture the $14-$22 "hidden" profit per slide that they are too afraid/busy to bill.
- **The Moat:** We aren't just an "AI viewer"—we are an **Audit-Ready Billing Infrastructure.**

---

### Instructions for Cursor:
1. "Read `ARCHITECTURE.md`."
2. "Refactor the existing dashboard in `components/dashboard.tsx` to match the GCP Enterprise aesthetic defined in Section 3."
3. "Scaffold the FastAPI backend in a `/backend` folder with the endpoints defined in Section 4."
4. "Ensure all numbers use Geist Mono and Emerald-600 for positive values."

---
