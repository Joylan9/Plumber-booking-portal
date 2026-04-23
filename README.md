<a name="top"></a>

![Header](https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,26&height=220&section=header&text=FlowMatch&fontSize=80&fontColor=fff&animation=twinkling&fontAlignY=32&desc=Premium%20Plumbing%20Services%20%E2%80%A2%20On%20Demand&descAlignY=58&descAlign=50)

<p align="center">
  <a href="https://git.io/typing-svg">
    <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&pause=1000&color=F0A500&center=true&vCenter=true&width=700&lines=%E2%9A%A1+Built+with+React+19+%2B+Vite+8;%F0%9F%94%90+JWT+Secured+REST+APIs;%F0%9F%8E%AD+Framer+Motion+%2B+GSAP+Animations;%F0%9F%93%A6+MERN+Stack+%E2%80%94+Full+Production+Grade;%F0%9F%9A%BF+Find+%E2%80%A2+Book+%E2%80%A2+Review+%E2%80%94+Trusted+Plumbers" alt="Typing SVG" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white"/>
  <img src="https://img.shields.io/badge/Node.js-Express_5-339933?style=for-the-badge&logo=nodedotjs&logoColor=white"/>
  <img src="https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?style=for-the-badge&logo=mongodb&logoColor=white"/>
  <img src="https://img.shields.io/badge/Framer_Motion-12-FF0050?style=for-the-badge&logo=framer&logoColor=white"/>
  <img src="https://img.shields.io/badge/GSAP-3.14-88CE02?style=for-the-badge&logo=greensock&logoColor=white"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white"/>
  <img src="https://img.shields.io/badge/Axios-HTTP-5A29E4?style=for-the-badge&logo=axios&logoColor=white"/>
  <img src="https://img.shields.io/badge/Nodemailer-Email-22B573?style=for-the-badge&logo=minutemailer&logoColor=white"/>
  <img src="https://img.shields.io/badge/Multer-Uploads-FF6600?style=for-the-badge&logo=files&logoColor=white"/>
  <img src="https://img.shields.io/github/stars/Joylan9/Plumber-booking-portal?style=for-the-badge&color=gold"/>
  <img src="https://img.shields.io/github/license/Joylan9/Plumber-booking-portal?style=for-the-badge"/>
</p>

---

## 📋 Table of Contents

| Section | Description |
|---------|-------------|
| [✨ Overview](#-overview) | What FlowMatch is & why it exists |
| [🎯 Features](#-features) | Complete feature breakdown |
| [🏗️ Architecture](#️-architecture) | System design & data flow |
| [💻 Tech Stack](#-tech-stack) | All technologies used |
| [📁 Project Structure](#-project-structure) | Full folder tree |
| [⚡ Quick Start](#-quick-start) | Get running in 5 minutes |
| [🔧 Installation](#-installation) | Detailed setup guide |
| [🌍 Environment Variables](#-environment-variables) | Config reference |
| [📡 API Reference](#-api-reference) | Endpoints & usage |
| [📸 Screenshots](#-screenshots) | Visual preview |
| [🗺️ Roadmap](#️-roadmap) | What's coming next |
| [🤝 Contributing](#-contributing) | How to contribute |
| [👤 Author](#-author) | About the developer |
| [📄 License](#-license) | License info |

<img src="https://raw.githubusercontent.com/trinib/trinib/82213791fa9ff58d3ca768ddd6de2489ec23ffca/images/footer.svg" width="100%">

## ✨ Overview

**FlowMatch** is a full-stack plumber booking platform built on the MERN stack that connects homeowners with verified plumbing professionals. Customers can search, filter, and book plumbers by specialty, view real-time ratings, and track booking status through a polished dashboard. Plumbers manage incoming jobs with accept/decline/complete workflows, while administrators oversee the entire ecosystem through a dedicated admin panel with user, booking, review, and category management.

The frontend delivers a premium experience powered by **React 19**, **Framer Motion**, and **GSAP ScrollTrigger** — featuring cinematic page transitions, parallax hero sections, and micro-interactions throughout. The backend is a hardened **Express 5** REST API secured with JWT authentication, role-based access control, bcrypt password hashing, and SMTP-based password recovery.

<p align="center">
  <img src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=900&q=80" width="80%" alt="FlowMatch Preview" style="border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.3)"/>
  <br/><em>🖼️ FlowMatch — Premium Plumber Booking Portal</em>
</p>

<img src="https://raw.githubusercontent.com/trinib/trinib/82213791fa9ff58d3ca768ddd6de2489ec23ffca/images/footer.svg" width="100%">

## 🎯 Features

<table>
<tr>
<td width="50%">

### 🔐 Authentication & Security
- JWT-based stateless authentication
- Role-based access: **Customer**, **Plumber**, **Admin**
- Bcrypt password hashing (bcryptjs)
- Forgot / Reset password via email (Nodemailer)
- Protected API routes with middleware guards
- CORS whitelist with origin validation

</td>
<td width="50%">

### 🚿 Booking System
- Search & filter plumbers by area, rating, category
- Real-time cost preview based on hourly rate
- Full booking lifecycle: Pending → Accepted → Completed
- Booking detail view with visual status timeline
- Role-specific dashboards (Customer vs Plumber)
- Cancel/decline workflows with confirmation modals

</td>
</tr>
<tr>
<td width="50%">

### ⭐ Reviews & Ratings
- Post-completion star rating (1–5) with comments
- Dynamic plumber rating aggregation
- Public plumber profile with review history
- Paginated review loading (load more)
- Interactive hover-to-rate star component

</td>
<td width="50%">

### ⚡ Performance & UX
- Vite 8 with lightning-fast HMR
- Code splitting per route (`React.lazy`)
- Lenis smooth scrolling engine
- GSAP ScrollTrigger parallax animations
- Framer Motion page transitions with blur
- Skeleton loaders for all async states

</td>
</tr>
<tr>
<td width="50%">

### 👤 User Profiles
- Avatar upload with live preview (Multer)
- Editable profile: name, phone, area, bio
- Plumber-specific: experience, hourly rate, services
- Profile completeness progress bar
- Multi-step registration with category selection

</td>
<td width="50%">

### 🛡️ Admin Dashboard
- Full CRUD: Users, Bookings, Reviews, Categories
- Tabbed interface with paginated data tables
- Category management (create/delete)
- Danger-zone deletion with confirmation modals
- Real-time status badges across all entities

</td>
</tr>
</table>

<img src="https://raw.githubusercontent.com/trinib/trinib/82213791fa9ff58d3ca768ddd6de2489ec23ffca/images/footer.svg" width="100%">

## 🏗️ Architecture

```mermaid
graph TB
    Client["🖥️ React 19 Frontend<br/>Vite 8 + Framer Motion + GSAP"]
    API["⚡ Express 5 API<br/>Node.js REST Server"]
    Auth["🔐 Auth Middleware<br/>JWT + Bcrypt + RBAC"]
    DB["🗄️ MongoDB<br/>Mongoose 9 ODM"]
    Email["📧 Email Service<br/>Nodemailer SMTP"]
    Upload["📁 File Upload<br/>Multer + Static Serve"]

    Client -->|"Axios HTTP"| API
    API --> Auth
    API --> DB
    API --> Email
    API --> Upload

    style Client fill:#61DAFB,color:#000
    style API fill:#339933,color:#fff
    style Auth fill:#F0A500,color:#000
    style DB fill:#47A248,color:#fff
    style Email fill:#22B573,color:#fff
    style Upload fill:#FF6600,color:#fff
```

### Request Flow

```mermaid
sequenceDiagram
    actor Customer
    participant React as React Frontend
    participant API as Express API
    participant Auth as Auth Middleware
    participant DB as MongoDB

    Customer->>React: Clicks "Book Now"
    React->>API: POST /api/bookings
    API->>Auth: Verify JWT Token
    Auth-->>API: Token Valid ✓
    API->>DB: Create Booking Document
    DB-->>API: Booking Saved ✓
    API-->>React: 201 Created + Booking Data
    React-->>Customer: Redirect to Confirmation Page
```

<img src="https://raw.githubusercontent.com/trinib/trinib/82213791fa9ff58d3ca768ddd6de2489ec23ffca/images/footer.svg" width="100%">

## 💻 Tech Stack

### Frontend
<p align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=react,vite,js,css,html&theme=dark"/>
  </a>
</p>

### Backend
<p align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=nodejs,express,mongodb&theme=dark"/>
  </a>
</p>

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Frontend** | React | 19.2 | UI component framework |
| **Frontend** | Vite | 8.0 | Build tool & dev server |
| **Frontend** | Framer Motion | 12.38 | Page transitions & animations |
| **Frontend** | GSAP | 3.14 | ScrollTrigger parallax effects |
| **Frontend** | Lenis | 1.3 | Smooth scroll engine |
| **Frontend** | React Router DOM | 7.14 | Client-side routing |
| **Frontend** | Axios | 1.15 | HTTP client |
| **Frontend** | React Intersection Observer | 10.0 | Viewport detection |
| **Backend** | Node.js + Express | 5.2 | REST API server |
| **Backend** | Mongoose | 9.4 | MongoDB ODM |
| **Backend** | JSON Web Token | 9.0 | Stateless authentication |
| **Backend** | Bcryptjs | 3.0 | Password hashing |
| **Backend** | Multer | 2.1 | File upload handling |
| **Backend** | Nodemailer | 8.0 | SMTP email delivery |
| **Backend** | CORS | 2.8 | Cross-origin resource sharing |
| **Backend** | Dotenv | 17.4 | Environment variables |
| **Database** | MongoDB | 7.x | Document database |

<img src="https://raw.githubusercontent.com/trinib/trinib/82213791fa9ff58d3ca768ddd6de2489ec23ffca/images/footer.svg" width="100%">

## 📁 Project Structure

```
📦 FlowMatch
├── 📂 frontend/
│   ├── 📂 src/
│   │   ├── 📂 components/          # 13 reusable UI components
│   │   │   ├── Navbar.jsx          # Scroll-aware sticky navigation
│   │   │   ├── Footer.jsx          # Site-wide footer
│   │   │   ├── DashboardLayout.jsx # Sidebar + content grid layout
│   │   │   ├── PageWrapper.jsx     # Framer Motion page transitions
│   │   │   ├── Toast.jsx           # Portal-based notification system
│   │   │   ├── ConfirmModal.jsx    # Danger-action confirmation dialog
│   │   │   ├── SkeletonLoader.jsx  # Shimmer loading placeholders
│   │   │   ├── StatusBadge.jsx     # Color-coded status pills
│   │   │   ├── ReviewCard.jsx      # Star rating display card
│   │   │   ├── ReviewForm.jsx      # Interactive star rating form
│   │   │   ├── EmptyState.jsx      # Friendly empty data messaging
│   │   │   ├── ErrorState.jsx      # Error with retry action
│   │   │   └── ErrorBoundary.jsx   # React error boundary wrapper
│   │   ├── 📂 pages/               # 13 route-level pages
│   │   │   ├── Home.jsx            # Hero + How It Works + Services
│   │   │   ├── Login.jsx           # Split-layout authentication
│   │   │   ├── Register.jsx        # Multi-step registration wizard
│   │   │   ├── ForgotPassword.jsx  # Email-based password recovery
│   │   │   ├── ResetPassword.jsx   # Token-based password reset
│   │   │   ├── PlumberList.jsx     # Searchable plumber directory
│   │   │   ├── PlumberProfile.jsx  # Detailed plumber profile + reviews
│   │   │   ├── BookingForm.jsx     # Service booking with cost preview
│   │   │   ├── Confirmation.jsx    # Post-booking success screen
│   │   │   ├── BookingDetail.jsx   # Status timeline + actions
│   │   │   ├── CustomerDashboard   # Stats + booking table
│   │   │   ├── PlumberDashboard    # Job cards + accept/decline
│   │   │   ├── AdminDashboard.jsx  # Full CRUD admin panel
│   │   │   └── Profile.jsx         # User profile editor + avatar
│   │   ├── 📂 services/            # API service layer (Axios)
│   │   │   ├── api.js              # Base Axios instance + interceptors
│   │   │   ├── authService.js      # Login, register, forgot/reset
│   │   │   ├── bookingService.js   # CRUD bookings
│   │   │   ├── plumberService.js   # Plumber directory queries
│   │   │   ├── reviewService.js    # Create & fetch reviews
│   │   │   ├── categoryService.js  # Category listing
│   │   │   ├── userService.js      # Profile update + avatar upload
│   │   │   ├── adminService.js     # Admin CRUD operations
│   │   │   └── apiError.js         # Centralized error handling
│   │   ├── 📂 context/             # React Context API
│   │   │   └── AuthContext.jsx     # Auth state + JWT persistence
│   │   ├── 📂 routes/              # Route protection
│   │   │   └── ProtectedRoute.jsx  # Auth-gated route wrapper
│   │   ├── 📂 styles/              # Design system
│   │   │   └── tokens.css          # Design tokens (colors, spacing)
│   │   ├── 📂 utils/               # Utility functions
│   │   │   └── format.js           # Date, currency, status helpers
│   │   ├── App.jsx                 # Root component + route config
│   │   ├── main.jsx                # Entry point + Lenis scroll
│   │   └── index.css               # Global styles + base components
│   ├── index.html                  # HTML entry with SEO meta tags
│   ├── vite.config.js              # Vite configuration
│   └── package.json                # Frontend dependencies
│
├── 📂 backend/
│   ├── 📂 src/
│   │   ├── 📂 controllers/         # Request handlers
│   │   │   ├── authController.js   # Register, login, password reset
│   │   │   ├── bookingController   # Create, list, status update
│   │   │   ├── plumberController   # Search & profile endpoints
│   │   │   ├── reviewController.js # Create & list reviews
│   │   │   ├── categoryController  # Category CRUD
│   │   │   ├── userController.js   # Profile & avatar management
│   │   │   └── adminController.js  # Admin-only operations
│   │   ├── 📂 routes/              # API route definitions
│   │   │   ├── authRoutes.js       # /api/auth/*
│   │   │   ├── bookingRoutes.js    # /api/bookings/*
│   │   │   ├── plumberRoutes.js    # /api/plumbers/*
│   │   │   ├── reviewRoutes.js     # /api/reviews/*
│   │   │   ├── categoryRoutes.js   # /api/categories/*
│   │   │   ├── userRoutes.js       # /api/users/*
│   │   │   └── adminRoutes.js      # /api/admin/*
│   │   ├── 📂 models/              # Mongoose schemas
│   │   │   ├── User.js             # Customer/Plumber/Admin model
│   │   │   ├── Booking.js          # Booking with status workflow
│   │   │   ├── Review.js           # Star rating + comment model
│   │   │   └── Category.js         # Service category model
│   │   ├── 📂 middleware/           # Express middleware
│   │   │   ├── authMiddleware.js   # JWT verify + role authorization
│   │   │   ├── adminMiddleware.js  # Admin-only gate
│   │   │   ├── errorMiddleware.js  # Global error handler
│   │   │   └── uploadMiddleware.js # Multer file upload config
│   │   ├── 📂 utils/               # Helper utilities
│   │   │   ├── generateToken.js    # JWT token generation
│   │   │   ├── httpError.js        # Custom HTTP error factory
│   │   │   ├── sanitizeUser.js     # Strip sensitive user fields
│   │   │   └── sendEmail.js        # Nodemailer SMTP wrapper
│   │   ├── 📂 scripts/             # CLI utilities
│   │   │   ├── createAdmin.js      # Seed admin user
│   │   │   ├── seedCategories.js   # Seed default categories
│   │   │   └── smokeTest.js        # API smoke test suite
│   │   ├── 📂 config/              # Configuration
│   │   │   └── db.js               # MongoDB connection
│   │   └── server.js               # Express app entry point
│   ├── 📂 uploads/                 # Avatar file storage
│   ├── .env.example                # Environment variable template
│   └── package.json                # Backend dependencies
│
└── 📂 Database/                    # Local MongoDB data directory
```
