<div align="center">

# 🚕 UCAB

### *Your Smart Ride, Anytime.*

[![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socket.io&logoColor=white)](https://socket.io)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

A full-stack **taxi booking platform** built for real-time ride matching between riders and drivers —  
powered by WebSockets, a file-based JSON database, and a beautiful React frontend.

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Auth** | Register & login for Riders and Drivers (JWT-secured) |
| 🚘 **Ride Search** | Search available cabs by vehicle type and location |
| 📡 **Real-Time Matching** | Instant ride requests broadcast via Socket.IO |
| 🗺️ **Live Tracking** | Track your driver on an interactive Leaflet map |
| 💳 **Payments** | Fare breakdown and simulated payment flow |
| 🎧 **Support** | Raise support tickets from your booking history |
| 🧑‍✈️ **Driver Dashboard** | Drivers accept/reject rides with live status updates |
| 🌱 **Seeded Data** | 10 pre-loaded driver captains — no DB setup needed |

---

## 🏗️ Tech Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| `express` | ^5.2.1 | HTTP server & API routing |
| `socket.io` | ^4.8.3 | Real-time bi-directional events |
| `jsonwebtoken` | ^9.0.3 | JWT authentication |
| `bcryptjs` | ^3.0.3 | Password hashing |
| `dotenv` | ^17.3.1 | Environment variable management |
| `cors` | ^2.8.6 | Cross-Origin Resource Sharing |
| `nodemon` | ^3.1.14 | Dev server auto-restart |

### Frontend
| Package | Version | Purpose |
|---|---|---|
| `react` + `react-dom` | ^19.2.4 | UI framework |
| `vite` | ^7.3.1 | Fast build tool & dev server |
| `react-router-dom` | ^7.13.1 | Client-side routing |
| `react-leaflet` + `leaflet` | ^5 / ^1.9 | Interactive map rendering |
| `socket.io-client` | ^4.8.3 | Real-time client |
| `axios` | ^1.13.6 | HTTP requests |
| `framer-motion` + `gsap` | latest | Animations |
| `sweetalert2` | ^11.26.21 | Beautiful alert dialogs |

---

## 📁 Project Structure

```
Ucab/
├── backend/
│   ├── src/
│   │   ├── server.js          # Entry point — Express + Socket.IO setup
│   │   ├── db.js              # File-based JSON database + seeding logic
│   │   ├── socket.js          # Socket.IO instance export
│   │   ├── middleware/        # Auth middleware (JWT verify)
│   │   └── routes/
│   │       ├── auth.js        # POST /api/auth/register, /login
│   │       ├── bookings.js    # Ride search, create, accept, complete
│   │       ├── drivers.js     # Driver registration & status
│   │       ├── payments.js    # Payment processing
│   │       └── support.js     # Support ticket creation & listing
│   ├── database.json          # 📦 Local JSON database (auto-created)
│   └── .env                   # Environment variables
└── frontend/
    ├── src/
    │   ├── App.jsx            # Root component + routes
    │   ├── pages/
    │   │   ├── HomePage.jsx
    │   │   ├── LoginPage.jsx / RegisterPage.jsx
    │   │   ├── SearchCabsPage.jsx
    │   │   ├── BookingsPage.jsx
    │   │   ├── RideTrackingPage.jsx
    │   │   ├── PaymentPage.jsx
    │   │   ├── HistorySupportPage.jsx
    │   │   ├── DriverLoginPage.jsx / DriverRegisterPage.jsx
    │   │   ├── DriverDashboardPage.jsx
    │   │   └── DriverVerificationPage.jsx
    │   └── main.jsx
    └── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/ucab.git
cd ucab
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create your environment file:

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Your `.env` should look like:

```env
PORT=5000
JWT_SECRET=your_super_secret_key_here
```

Start the backend dev server:

```bash
npm run dev
```

> ✅ Backend running at **http://localhost:5000**

---

### 3️⃣ Frontend Setup

Open a **new terminal**, then:

```bash
cd frontend
npm install
npm run dev
```

> ✅ Frontend running at **http://localhost:5173**

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new rider | ❌ |
| `POST` | `/api/auth/login` | Login (rider or driver) | ❌ |
| `POST` | `/api/drivers/register` | Register as a driver | ✅ |
| `GET` | `/api/drivers` | List all available drivers | ✅ |
| `POST` | `/api/bookings/search` | Search for available cabs | ✅ |
| `POST` | `/api/bookings` | Create a new booking | ✅ |
| `PATCH` | `/api/bookings/:id/accept` | Driver accepts a ride | ✅ |
| `PATCH` | `/api/bookings/:id/complete` | Complete a ride | ✅ |
| `GET` | `/api/bookings/my` | Get user's booking history | ✅ |
| `POST` | `/api/payments/:bookingId` | Process payment | ✅ |
| `POST` | `/api/support` | Raise a support ticket | ✅ |
| `GET` | `/api/support/my` | Get user's tickets | ✅ |

---

## 🧑‍✈️ Seeded Test Accounts

The database comes pre-loaded with **10 driver captains** for testing. No sign-up required.

| Name | Email | Vehicle |
|---|---|---|
| Amit Sharma | `amit.sharma@ucab.in` | 🏍️ Bike |
| Karan Patel | `karan.patel@ucab.in` | 🛺 Auto |
| Rajesh Kumar | `rajesh.kumar@ucab.in` | 🚗 Car |
| Suresh Pillai | `suresh.pillai@ucab.in` | 🚙 SUV |
| Vikram Singh | `vikram.singh@ucab.in` | 🏍️ Bike |
| Anil Reddy | `anil.reddy@ucab.in` | 🛺 Auto |
| Rohan Deshmukh | `rohan.deshmukh@ucab.in` | 🚗 Car |
| Pranav Nair | `pranav.nair@ucab.in` | 🚙 SUV |
| Sanjay Dutt | `sanjay.dutt@ucab.in` | 🏍️ Bike |
| Vijay Mallya | `vijay.mallya@ucab.in` | 🚗 Car |

> **Password for all seeded drivers:** `ucabdriver123`

To test as a **rider**, create a new account at `http://localhost:5173/register`.

---

## 🔄 Real-Time Architecture

```
Rider App                Backend (Socket.IO)            Driver App
   │                           │                            │
   │── POST /bookings ────────▶│                            │
   │                           │── emit('newRideRequest') ─▶│ (driver_<vehicleType> room)
   │                           │                            │── accepts ride
   │                           │◀─ emit('rideAccepted') ────│
   │◀─ emit('rideAccepted') ───│ (rider_<id> room)          │
   │                           │                            │
```

- **Drivers** join a vehicle-type room (e.g., `driver_car`) upon login
- **Riders** join a personal room (e.g., `rider_<id>`) after booking
- Ride events flow through these rooms in real-time with zero polling

---

## 📝 License

This project is licensed under the **ISC License**. Feel free to use and modify it for your own projects.

---

<div align="center">

Made with ❤️ as part of the **SmartBridge Internship Project**

</div>
