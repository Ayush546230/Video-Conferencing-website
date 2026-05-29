# 🔐 AuthCraft — Modern Authentication Showcase

A full-stack MERN application demonstrating two production-grade, **100% free** authentication methods:

- **Google OAuth 2.0 + OIDC** — via Google Identity Services (GIS)
- **WebAuthn Passkeys (FIDO2)** — biometrics, PIN, Touch ID, Face ID, Windows Hello

**No proprietary SDKs. No per-user fees. No passwords stored.**

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + React Router |
| Backend | Node.js + Express 5 (ESM) |
| Database | MongoDB + Mongoose |
| Google Auth | google-auth-library (MIT, free) |
| Passkeys | @simplewebauthn/server + @simplewebauthn/browser (MIT, free) |
| Security | Helmet, express-rate-limit, CORS, JWT, HttpOnly sessions |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or [MongoDB Atlas free tier](https://www.mongodb.com/cloud/atlas/register))
- A free Google Cloud account (for Google OAuth)

### 1. Clone & Install

```bash
# Install root dependencies
npm install

# Install all dependencies
npm run install:all
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your values
```

### 3. Configure Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env — add VITE_GOOGLE_CLIENT_ID
```

### 4. Get Free Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add Authorized JavaScript origins:
   - `http://localhost:3000`
7. Add Authorized redirect URIs:
   - `http://localhost:3000`
8. Copy the **Client ID** → paste into both `.env` files

**Cost: $0 — Google OAuth is completely free**

### 5. Run the App

```bash
# From root directory — runs both frontend & backend
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## 🔑 Authentication Methods

### Google OAuth 2.0 + OIDC
- Uses [Google Identity Services](https://developers.google.com/identity) (free)
- One Tap or Sign-In button UI
- Backend verifies JWT ID token with Google's public keys (JWKS)
- No redirect flows needed — ID token approach is simpler and more secure

### WebAuthn Passkeys (FIDO2)
- Uses [@simplewebauthn](https://simplewebauthn.dev/) (MIT license, free)
- Supports: Touch ID, Face ID, Windows Hello, Android biometrics, device PIN
- Discoverable credentials (no email needed for login)
- Multi-device passkeys sync via iCloud Keychain / Google Password Manager
- All cryptography: ES256 (P-256) and RS256

---

## 🛡️ Security Features

- **JWT** — RS256 signed, 7-day expiry
- **HttpOnly sessions** — WebAuthn challenges stored server-side, never exposed to JS
- **Rate limiting** — 20 auth requests per 15 minutes per IP
- **CORS** — configured to your frontend URL only
- **Helmet** — sets security headers (CSP, HSTS, X-Frame-Options, etc.)
- **Counter-based replay prevention** — WebAuthn counters prevent credential replay
- **Origin binding** — passkeys only work on your exact domain (phishing-proof)

---

## 📁 Project Structure

```
auth-showcase/
├── backend/
│   ├── controllers/
│   │   ├── authController.js      # Google OAuth logic
│   │   └── passkeyController.js   # WebAuthn registration + auth
│   ├── middleware/
│   │   └── auth.js                # JWT verification middleware
│   ├── models/
│   │   └── User.js                # User schema with passkey subdocs
│   ├── routes/
│   │   ├── auth.js                # /api/auth/* routes
│   │   └── passkeys.js            # /api/passkeys/* routes
│   ├── server.js                  # Express app entry
│   └── .env.example
└── frontend/
    └── src/
        ├── context/
        │   └── AuthContext.jsx    # Auth state + API calls
        ├── pages/
        │   ├── HomePage.jsx       # Auth method explanations
        │   ├── LoginPage.jsx      # Google + Passkey login UI
        │   └── DashboardPage.jsx  # Deep dive + account management
        ├── components/
        │   └── Navbar.jsx
        ├── App.jsx                # Router + route guards
        └── index.css              # White + cream design system
```

---

## 🌐 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/google` | Verify Google ID token |
| GET | `/api/auth/me` | Get current user (JWT required) |
| POST | `/api/passkeys/register/options` | Get WebAuthn registration challenge |
| POST | `/api/passkeys/register/verify` | Verify + save passkey |
| POST | `/api/passkeys/auth/options` | Get WebAuthn auth challenge |
| POST | `/api/passkeys/auth/verify` | Verify passkey + issue JWT |
| DELETE | `/api/passkeys/:credentialID` | Remove a passkey (JWT required) |
| GET | `/api/health` | Health check |

---

## 📱 Mobile Compatibility

### Web (PWA)
All auth methods work on mobile browsers:
- **Safari on iOS 16+** — Touch ID / Face ID passkeys (iCloud Keychain sync)
- **Chrome on Android** — Fingerprint / PIN passkeys (Google Password Manager sync)
- **Google OAuth** — Works in all mobile browsers via popup or redirect

### React Native / Capacitor
To extend to a native mobile app:
- **Google OAuth**: Use `@react-native-google-signin/google-signin` (free)
- **Passkeys**: Use `react-native-passkey` or native APIs (iOS AuthenticationServices, Android Credential Manager)
- The backend APIs remain identical — only the frontend auth initiation changes

---

## 💰 Cost Summary

| Feature | Cost |
|---------|------|
| Google OAuth (via GIS + google-auth-library) | **Free** |
| WebAuthn / Passkeys (@simplewebauthn) | **Free** |
| Web Push Notifications (VAPID) | **Free** |
| MongoDB Atlas (up to 512MB) | **Free** |
| Node.js / Express | **Free** |
| **Total** | **$0/month** |

---

## 📖 Resources

- [WebAuthn Spec (W3C)](https://www.w3.org/TR/webauthn-2/)
- [FIDO Alliance](https://fidoalliance.org/passkeys/)
- [SimpleWebAuthn Docs](https://simplewebauthn.dev/)
- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [Web Push Protocol (RFC 8030)](https://www.rfc-editor.org/rfc/rfc8030)
- [VAPID (RFC 8292)](https://www.rfc-editor.org/rfc/rfc8292)
