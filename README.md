# aiRender: Advanced Video Conferencing & Authentication Platform

A comprehensive full-stack MERN (MongoDB, Express, React, Node.js) enterprise application demonstrating modern, passwordless authentication alongside a fully featured, branded video conferencing dashboard. This project integrates seamless authentication flows with a high-performance video communication suite powered by Jitsi as a Service (JaaS).

## 🌟 Key Features

### Enterprise Video Conferencing (JaaS Integration)
- **Instant & Scheduled Meetings**: Easily launch instant meetings or schedule future sessions with dedicated meeting URLs.
- **Intelligent Time Zone Management**: Integrated scheduling logic powered by `luxon` that automatically detects the user's local time zone, defaults new meetings to the nearest 30-minute block, and sets an intelligent 1-hour default duration.
- **Pre-Join Lobby**: Professional waiting area allowing users to configure audio and video settings before joining an active meeting.
- **Private Meeting Rooms**: Enterprise-grade host controls featuring a functional lobby where hosts can explicitly admit or deny guests.
- **Automated Host Privileges**: Secure JWT-based host authentication that automatically identifies meeting creators as Moderators with full host privileges.
- **Custom Branding**: Fully branded "hi" UI experience, powered by aiRender, with streamlined interfaces and removed legacy Jitsi watermarks.
- **Seamless Reconnection**: Robust handling of meeting lifecycle events, preventing disruptive post-call screens and ensuring a smooth lobby-to-meeting transition.

### Advanced Authentication Suite
- **Google OAuth Integration**: Streamlined single sign-on (SSO) utilizing Google's identity services for quick access.
- **Passkey Authentication (WebAuthn)**: Biometric and hardware-based authentication (Fingerprint, Face ID, Windows Hello) for enhanced security and a frictionless, passwordless login.
- **Push Notification Authentication**: Out-of-band (OOB) authentication allowing users to securely approve desktop login requests directly via mobile device push notifications.

---

## 🏗️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend UI** | React 18, TypeScript, Vite, React Router, Lucide React |
| **Backend API** | Node.js, Express 5 |
| **Database** | MongoDB, Mongoose |
| **Video Platform**| `@jitsi/react-sdk` (Jitsi as a Service) |
| **OAuth** | `google-auth-library` |
| **Passkeys** | `@simplewebauthn` |
| **Push Notifications**| Web Push API (VAPID) |
| **Security** | Helmet, Rate Limiting, CORS, JWT, HTTP-only Cookies |

---

## 🚀 Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Local instance or MongoDB Atlas cluster)
- Google Cloud Platform account (for OAuth credentials)
- Jitsi as a Service (JaaS) Account / API Keys

### 1. Installation

Clone the repository and install dependencies for both the frontend and backend:

```bash
# Install root dependencies
npm install

# Install frontend and backend dependencies concurrently
npm run install:all
```

### 2. Backend Configuration

Navigate to the `backend` directory and configure your environment variables:

```bash
cd backend
cp .env.example .env
```
*Edit the `.env` file and provide your MongoDB connection string, JWT secrets, and JaaS App ID / RSA Private Key for host authentication.*

### 3. Frontend Configuration

Navigate to the `frontend` directory and configure the environment variables:

```bash
cd frontend
cp .env.example .env
```
*Edit the `.env` file and provide your `VITE_GOOGLE_CLIENT_ID`, VAPID keys, and `VITE_JAAS_APP_ID`.*

### 4. Running the Application

Return to the root directory and start the development servers:

```bash
npm run dev
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`

---

## 🔑 Authentication Flows Explained

### Passkeys (WebAuthn)
- Utilizes device-level biometrics (e.g., Touch ID, Face ID, Windows Hello).
- Eliminates password-related vulnerabilities (phishing, credential stuffing) through public key cryptography.

### Push Notification Authentication
- Facilitates cross-device login. A user attempting to authenticate on a desktop triggers a push notification to their registered mobile device.
- Upon approval on the mobile device, the desktop session is authorized automatically.

### Google OAuth
- Supports both the "One Tap" prompt and standard button-based sign-in.
- The backend securely verifies the ID token to authenticate the user session.

---

## 🛡️ Security & Privacy Measures

- **Private Meetings**: Explicit host approval workflows prevent unauthorized guests from joining active meetings.
- **JSON Web Tokens (JWT)**: Used for stateless session management and generating secure Jitsi host tokens.
- **Secure Cookies**: Critical tokens are stored in `HttpOnly`, `Secure` (in production), and `SameSite` cookies to mitigate XSS attacks.
- **Rate Limiting & Helmet**: API endpoints are protected against brute-force attacks and enforced with secure HTTP headers.

---

## 📁 Project Structure

```text
auth-showcase/
├── backend/
│   ├── controllers/
│   │   ├── authController.js      # Google OAuth logic
│   │   ├── meetingsController.js  # JaaS JWT generation & meeting logic
│   │   ├── passkeyController.js   # WebAuthn logic
│   │   └── pushAuthController.js  # Push notification handling
│   ├── routes/
│   │   ├── auth.js                # OAuth routes
│   │   ├── meetings.js            # Video conferencing endpoints
│   │   ├── passkeys.js            # WebAuthn routes
│   │   └── pushAuth.js            # Push authentication routes
│   └── server.js                  # Express application entry point
└── frontend/
    └── src/
        ├── components/
        │   ├── dashboard/         # Dashboard & recent meetings UI
        │   ├── meeting/           # JitsiRoom and PreJoinScreen components
        │   ├── schedule/          # Meeting scheduling and invite logic
        │   └── Navbar.tsx         # Branded navigation
        ├── pages/
        │   ├── LoginPage.jsx      # Multi-flow auth interface
        │   └── DashboardPage.jsx  # Main application dashboard
        └── App.tsx                # Routing configuration
```

---

## 🌐 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/google` | Verifies Google ID token and issues application JWT. |
| `GET` | `/api/meetings` | Retrieves user's scheduled and recent meetings. |
| `POST` | `/api/meetings/schedule` | Schedules a new video meeting with privacy options. |
| `GET` | `/api/meetings/token/:room` | Generates a JaaS JWT for moderator/host privileges. |
| `POST` | `/api/passkeys/auth/...` | Initiates and verifies WebAuthn authentication. |
| `POST` | `/api/push-auth/request` | Triggers a push notification to a mobile device. |

---

*Powered by aiRender.*
