<div align="center">
  <img src="https://img.icons8.com/color/124/pipeline.png" alt="Plumber Portal Logo"/>
  <h1><b>Premium Plumber Booking Portal</b></h1>
  <p><b>An Enterprise-Grade, MERN-stack Architecture with GSAP & Framer Motion Integration</b></p>
  
  [![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
  [![Framer Motion](https://img.shields.io/badge/Framer_Motion-UI/UX-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
  [![Vanilla CSS](https://img.shields.io/badge/Vanilla_CSS-Styling-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
</div>

<br />

> [!NOTE]
> This platform transcends standard industry portals by seamlessly binding complex backend database relational modeling with highly polished, 60fps cinematic rendering physics on the frontend using **GSAP** and **Framer Motion**.

---

## ✦ 1. Project Overview

The **Premium Plumber Booking Portal** is a sophisticated, dual-ecosystem application. It dynamically supports independent workflows for both **Customers** (booking, tracking, managing) and **Professionals** (availability, statistical metrics, service parsing) unified under an ultra-responsive UI.

### Key Objectives Achieved:
1. **Uncompromised UI/UX:** Built cleanly upon standard Vanilla CSS executing deep logic variables (`--navy`, `--sky`, `--amber`) avoiding utility-class clutter while achieving jaw-dropping parallax effects.
2. **Absolute Security Constraints:** Enterprise logic enforcing encrypted JWT allocations mapped conditionally against `Customer`, `Plumber`, and `Admin` Roles independently.
3. **Smooth Scroll Engine:** Native injection of `Lenis` physics overriding browser default jarring-scrolls for silky, mathematical progression metrics universally.

---

## ✦ 2. Aesthetic Design System

All aesthetic configurations are heavily enforced via native CSS Variables mapped locally to our design tokens. 

### Core Palette
- **Primary Navy (`#0A2540`)**: Headings, Hero layouts, and Primary buttons.
- **Golden Amber (`#F0A500`)**: Interactive Urgent Call-to-Actions and Hover States.
- **Sky Backgrounds (`#F5F7FA`)**: Soft container rendering and page structures.
- **Glassmorphism Metrics**: `background: rgba(10, 37, 64, 0.85); backdrop-filter: blur(12px);` seamlessly injecting depth into tracking modules (eg. Navbar Y-Axis > 80px logic).

### Typography
- Titles & Headers: **[Syne](https://fonts.google.com/specimen/Syne)** (Heavy, artistic, dynamic impact).
- Body & UI Interfaces: **[Inter](https://fonts.google.com/specimen/Inter)** (High-legibility, precision UI).

---

## ✦ 3. Core Technical Architecture 

### Backend (Node / Express / MongoDB)
| Module | Core Functionality |
| :--- | :--- |
| **`User.js` Model** | Dual-Role Schema parsing `experience`, `hourlyRate`, and `services` securely. Built-in `bcrypt` middleware and natively hashed `crypto` Reset Tokens. |
| **`Booking.js` Model** | Relational data tracking referencing Customer and Plumber ObjectIDs simultaneously. |
| **Auth Controllers** | Handling native JWT allocations. Isolated logic processing dynamic secure links parsing `forgotPassword` & `resetPassword` flows implicitly mimicking SMTP behavior organically. |

### Frontend (React + Vite)
| Animation Logic Layer | Execution Implementation |
| :--- | :--- |
| **Framer Motion Elements** | Injected `<AnimatePresence>` around specific Routers dropping `<PageWrapper>` fade variants mapping dynamically against Route `.pathnames`. Form loading morphing arrays cleanly into `Rotate` Checkmarks! |
| **GSAP ScrollTriggers** | Scrubbed logic tracking absolute Y-axis physics simulating spatial depth seamlessly explicitly on the Landing Hero images tracking identically across the `parallax-bg`. |
| **Vanilla CSS Gradients** | Dual-pane Split Layout Auth UI forms executing infinitely moving `@keyframes gradientShift` creating a premium flowing liquid structure. |

---

## ✦ 4. Advanced Features Developed

### 1. Enterprise Authentication & Recovery Stack
- Splitting the Standard UI into **Dual-pane Glass architectures**. Error feedback mechanisms animate gracefully into existence using React Animate arrays. 
- Created a highly secure mapping logic converting lost passwords across the `/forgot-password` and `/reset-password/:token` routes seamlessly utilizing Node Crypto libraries bypassing standard database constraints legally.

### 2. High-Performance Plumber Listing (`/plumbers`)
- Render arrays simulating Server-Side network latency explicitly using complex **CSS Shimmer skeletons** preventing layout jumps during DB connections.
- Native `.map` Framer loops constructing absolute stagger arrays; every Plumber card drops down from Axis-Y beautifully cascading onto the screen! 

---

## ✦ 5. Environment & Installation Guidelines

To deploy this application precisely locally, ensure Node.js and MongoDB (Community/Atlas) are actively listening.

### A. Backend Boot Sequences
```bash
# 1. Navigate dynamically into backend
cd backend

# 2. Setup your local Environment Variables natively (.env)
PORT=5000
MONGODB_URI=mongodb://localhost:27017/plumber_booking_portal
JWT_SECRET=supersecretjwtkey_replace_me_in_production

# 3. Process execution
npm install
npm run dev
```

### B. Frontend Boot Sequences
```bash
# 1. Navigate securely to frontend logic
cd frontend

# 2. Connect environment linking mapped strictly to Node
VITE_API_BASE_URL=http://localhost:5000/api

# 3. Mount React Bundler globally
npm install
npm run dev
```

> [!IMPORTANT]
> Because standard testing parameters assume active backend nodes, if you see the **Skeleton Loaders loading forever** or a `Network Error`, verify the `MongoDB` connection has fully initialized globally prior to launching the Frontend!

---
<div align="center">
  <i>Developed and structured via Agentic Architecture Mapping.</i>
</div>
