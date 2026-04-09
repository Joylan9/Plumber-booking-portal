<div align="center">

<img src="https://img.icons8.com/color/124/pipeline.png" alt="Plumber Portal Logo"/>

# **Premium Plumber Booking Portal**

**An Enterprise-Grade, MERN-stack Architecture with GSAP & Framer Motion Integration**

### 🔗 **[Live Demo Deployment](https://internship-five-tau.vercel.app/)**

[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-Backend-404D59?style=for-the-badge)](https://expressjs.com/)
[![Lenis](https://img.shields.io/badge/Lenis-Smooth_Scroll-000000?style=for-the-badge)](https://lenis.studiofreight.com/)
[![GSAP](https://img.shields.io/badge/GSAP-Animations-88CE02?style=for-the-badge&logo=greensock&logoColor=white)](https://greensock.com/gsap/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-UI/UX-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)

<br />

> **Experience the new standard of industry portals.** This platform transcends traditional booking systems by seamlessly binding complex backend relational database modeling with highly polished, 60fps cinematic rendering physics on the frontend using **GSAP** and **Framer Motion**.

</div>

---

## 📑 Table of Contents
- [Project Overview](#-project-overview)
- [Aesthetic & UI/UX Design System](#-aesthetic--uiux-design-system)
- [Core Technical Architecture](#-core-technical-architecture)
- [Advanced Features Developed](#-advanced-features-developed)
- [Project Structure](#-project-structure)
- [Environment & Installation Guidelines](#-environment--installation-guidelines)

---

## 🚀 Project Overview

The **Premium Plumber Booking Portal** is a sophisticated, dual-ecosystem application. It dynamically supports independent workflows for both **Customers** (booking, tracking, managing) and **Professionals** (availability, service parsing) unified under an ultra-responsive, visually stunning UI.

### Key Objectives Achieved:
1. **Uncompromised UI/UX:** Built cleanly upon standard Vanilla CSS executing deep logic variables (`--navy`, `--sky`, `--amber`) avoiding utility-class clutter while achieving jaw-dropping parallax effects and page transitions.
2. **Absolute Security Constraints:** Enterprise logic enforcing encrypted JWT allocations mapped conditionally against `Customer`, `Plumber`, and `Admin` Roles independently.
3. **Smooth Scroll Engine:** Native injection of `Lenis` physics overriding browser-default jarring scrolls for silky, mathematical progression metrics universally.

---

## 🎨 Aesthetic & UI/UX Design System

All aesthetic configurations are heavily enforced via native CSS Variables mapped locally to our design tokens, bringing a modern, corporate, yet engaging identity to the platform.

### Core Palette
- 🔵 **Primary Navy (`#0A2540`)**: Imparts trust and reliability. Used for Headings, Hero layouts, and Primary buttons.
- 🟡 **Golden Amber (`#F0A500`)**: Interactive Urgent Call-to-Actions, Hover States, and alerts.
- ⚪ **Sky Backgrounds (`#F5F7FA`)**: Soft container rendering and page structures to reduce eye strain.
- 🪟 **Glassmorphism Metrics**: `background: rgba(10, 37, 64, 0.85); backdrop-filter: blur(12px);` seamlessly injecting depth into tracking modules (e.g., Navbar Y-Axis > 80px logic).

### Typography
- **Titles & Headers:** **[Syne](https://fonts.google.com/specimen/Syne)** (Heavy, artistic, dynamic impact).
- **Body & Interfaces:** **[Inter](https://fonts.google.com/specimen/Inter)** (High-legibility, precision UI).

---

## 🏗️ Core Technical Architecture

### Backend Stack (Node.js / Express / MongoDB)
| Module | Core Functionality |
| :--- | :--- |
| **`User.js` Model** | Dual-Role Schema parsing `experience`, `hourlyRate`, and `services` securely. Built-in `bcrypt` middleware and natively hashed `crypto` Reset Tokens. |
| **`Booking.js` Model** | Relational data tracking referencing Customer and Plumber ObjectIDs simultaneously. |
| **Auth Controllers** | Handling native JWT allocations. Isolated logic processing dynamic secure links parsing `forgotPassword` & `resetPassword` flows natively mimicing secure enterprise workflows. |
| **Reviews & Categories** | Robust schemas ensuring service categories and customer ratings are strictly tracked and relational. |

### Frontend Stack (React 19 / Vite / Framer Motion)
| Animation Logic Layer | Execution Implementation |
| :--- | :--- |
| **Framer Motion Elements** | Injected `<AnimatePresence>` around specific Routers dropping `<PageWrapper>` fade variants mapping dynamically against Route `.pathnames`. Form loading morphing arrays cleanly into visual feedback! |
| **GSAP ScrollTriggers** | Scrubbed logic tracking absolute Y-axis physics simulating spatial depth seamlessly across the application. |
| **Lenis Smooth Scroll** | Globally mounted context wrapper ensuring the DOM moves with inertia and mathematical precision, preventing default scrolling judder. |
| **CSS Modules & Patterns** | Dual-pane Split Layout Auth UI forms executing infinitely moving `@keyframes gradientShift` creating a premium flowing liquid structure. |

---

## ✨ Advanced Features Developed

### 1. Enterprise Authentication & Recovery Stack
- **Dual-Pane Glass Architectures:** Reimagined the standard login UI into an immersive visual experience. Error feedback and validations animate gracefully into existence using Framer Motion arrays.
- **Password Recovery Flow:** Created a highly secure mapped logic converting lost passwords across the `/forgot-password` and `/reset-password/:token` routes seamlessly, utilizing Node Crypto libraries bypassing standard database constraints securely.
- **Role-Based Access Control (RBAC):** Strict JWT middleware segregating the API routes between users, professional plumbers, and administrators.

### 2. High-Performance Plumber Listing Directory (`/plumbers`)
- **Shimmering Load Skeletons:** Render arrays simulating Server-Side network latency explicitly using complex CSS Shimmer skeletons. This creates an enterprise feel, preventing layout jumps during MongoDB data fetches.
- **Cascading Entry Animations:** Native array mapping via Framer loops constructing absolute stagger arrays; every Plumber profile card dynamically drops into the UI layout beautifully cascading onto the screen!
- **Dynamic Service Filters:** Fast frontend filtering leveraging React Hooks to sort and display plumbers based on specialties and availability.

---

## 📂 Project Structure

```text
📦 Plumber Booking Portal
 ┣ 📂 backend
 ┃ ┣ 📂 src
 ┃ ┃ ┣ 📂 config         # DB connection logic and ENV mappers
 ┃ ┃ ┣ 📂 controllers    # API endpoints logic (Auth, Users, Bookings)
 ┃ ┃ ┣ 📂 middleware     # JWT guarding, Error handling
 ┃ ┃ ┣ 📂 models         # Mongoose DB Schemas
 ┃ ┃ ┣ 📂 routes         # Express Router endpoints
 ┃ ┃ ┗ 📂 utils          # Cryptography, Tokens, Helper functions
 ┃ ┣ 📜 server.js        # Main Express server entrypoint
 ┃ ┗ 📜 package.json     # Backend dependencies
 ┃
 ┗ 📂 frontend
   ┣ 📂 src
   ┃ ┣ 📂 assets         # Global images, icons, and fonts
   ┃ ┣ 📂 components     # Reusable UI parts (Navbar, Loaders, Buttons)
   ┃ ┣ 📂 context        # React Context (Auth State, Scroll Logic)
   ┃ ┣ 📂 pages          # Individual route components (Home, Auth, Plumbers)
   ┃ ┣ 📂 routes         # Protected route architectures
   ┃ ┣ 📂 services       # Axios API integration controllers
   ┃ ┣ 📜 App.jsx        # Routing configuration and layout wrapping
   ┃ ┗ 📜 index.css      # Core Vanilla CSS variables & global styling
   ┗ 📜 package.json     # Frontend dependencies (Framer, GSAP, Lenis)
```

---

## 🛠️ Environment & Installation Guidelines

To deploy this application flawlessly locally, strictly adhere to the boot sequences below. **MongoDB (Community or Atlas)** and **Node.js** must be properly installed and running.

### A. Backend Boot Sequence
```bash
# 1. Navigate into the backend directory
cd backend

# 2. Setup your local Environment Variables (.env)
PORT=5000
MONGODB_URI=mongodb://localhost:27017/plumber_booking_portal
JWT_SECRET=supersecretjwtkey_replace_me_in_production

# 3. Install dependencies and start the development server
npm install
npm run dev
```

### B. Frontend Boot Sequence
```bash
# 1. Navigate into the frontend directory
cd frontend

# 2. Connect environment linking mapped strictly to the Backend Node
# Create a .env file locally directly in the /frontend folder:
VITE_API_BASE_URL=http://localhost:5000/api

# 3. Mount React Bundler globally and spin up Vite UI
npm install
npm run dev
```

> [!CAUTION]
> **API Configuration Notice:** Because standard testing parameters assume active backend nodes, if you see the **Skeleton Loaders loading infinitely** or catch a `Network Error`, verify the `MongoDB` connection has fully initialized prior to launching the Frontend and that your `.env` contains `VITE_API_BASE_URL`!

---

<div align="center">
  <br />
  <i>Architected with precision. Engineered for performance.</i>
  <br />
</div>