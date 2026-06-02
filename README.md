# 🔐 AuthCraft — My Cool Authentication Project

Hi everyone! This is a full-stack MERN project I built to show off three really awesome, **100% free** ways to log into an app:

- **Google Login** — Just click a button to log in with your Google account.
- **Passkeys** — Log in using your fingerprint, Face ID, or Windows Hello (super safe and no passwords!).
- **Push Notification Auth** — Send a notification to your phone and just tap "Approve" to log in on your computer!

I wanted to build this without paying for any expensive third-party tools, and without storing any dangerous passwords.

---

## 🏗️ What I Used to Build This

| Part | What I used |
|-------|-----------|
| Frontend | React 18, Vite, and React Router |
| Backend | Node.js with Express 5 |
| Database | MongoDB and Mongoose |
| Google Auth | `google-auth-library` (free!) |
| Passkeys | `@simplewebauthn` (free!) |
| Push Notifications | Web Push API (VAPID) (free!) |
| Security | Helmet, rate limits, CORS, JWTs, and secure cookies |

---

## 🚀 How to Run It on Your Computer

### What you need first
- Node.js (version 18 or higher)
- MongoDB (running locally or a free cloud account on Atlas)
- A free Google Cloud account for the Google login part

### 1. Download and Install

```bash
# Install the main stuff
npm install

# Install everything for frontend and backend
npm run install:all
```

### 2. Set up the Backend

```bash
cd backend
cp .env.example .env
# Open the .env file and put your own database link and secret keys in there
```

### 3. Set up the Frontend

```bash
cd frontend
cp .env.example .env
# Open this .env file and add your VITE_GOOGLE_CLIENT_ID and VAPID keys
```

### 4. How to get the Google Keys (for free)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Make a new project
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Pick **Web application**
6. Add `http://localhost:3000` to the Authorized JavaScript origins
7. Add `http://localhost:3000` to the Authorized redirect URIs
8. Copy the **Client ID** and paste it into both of your `.env` files.

### 5. Start the App!

```bash
# Make sure you are in the main project folder
npm run dev
```

- See the frontend here: http://localhost:3000
- The backend API runs here: http://localhost:5000

---

## 🔑 How the Logins Work

### Google Login
- It uses Google's free sign-in tools.
- It shows that neat "One Tap" popup or a regular button.
- The backend checks the token Google gives us to make sure it's real. It's really simple!

### Passkeys
- You can use your phone's fingerprint, Face ID, or Windows Hello.
- It's super secure because it doesn't even use passwords.
- It syncs across your devices if you use iCloud or Google Password Manager.

### Push Notification Auth
- If you're trying to log in on your laptop, the app sends a push notification to your phone.
- You just tap "Yes, it's me" on your phone, and boom, your laptop logs in!
- It uses the standard Web Push API so we don't have to pay for SMS or anything.

---

## 🛡️ How I Made It Secure

- **JWTs** — Special tokens that expire in 7 days so you don't stay logged in forever if you lose your device.
- **Secure Cookies** — The backend hides some important data in cookies so hackers can't easily steal it.
- **Rate limiting** — Stops bad guys from trying to guess stuff too fast (only 20 tries per 15 minutes).
- **Helmet & CORS** — Extra locks on the server to make sure only our app can talk to it.

---

## 📁 How My Files are Organized

```
auth-showcase/
├── backend/
│   ├── controllers/
│   │   ├── authController.js      # Google stuff
│   │   ├── passkeyController.js   # Fingerprint stuff
│   │   └── pushAuthController.js  # Push notification stuff!
│   ├── middleware/
│   │   └── auth.js                # Checks if you are logged in
│   ├── models/
│   │   └── User.js                # Database layout for users
│   ├── routes/
│   │   ├── auth.js                # Auth routes
│   │   ├── passkeys.js            # Passkey routes
│   │   └── pushAuth.js            # Push routes
│   ├── server.js                  # The main backend file
│   └── .env.example
└── frontend/
    └── src/
        ├── context/
        │   └── AuthContext.jsx    # Keeps track of who is logged in
        ├── pages/
        │   ├── HomePage.jsx       # Explains the app
        │   ├── LoginPage.jsx      # Where you actually log in
        │   └── DashboardPage.jsx  # Where you go after you log in
        ├── components/
        │   └── Navbar.jsx
        ├── App.jsx                # Connects all the pages
        └── index.css              # Makes it look pretty!
```

---

## 🌐 The API Routes I Made

| Method | Path | What it does |
|--------|------|-------------|
| POST | `/api/auth/google` | Checks the Google token |
| GET | `/api/auth/me` | Tells you who is logged in |
| POST | `/api/passkeys/register/...` | Saves a new passkey |
| POST | `/api/passkeys/auth/...` | Logs you in with a passkey |
| POST | `/api/push-auth/request` | Sends the notification to your phone |
| POST | `/api/push-auth/respond` | When you tap "Yes" on your phone |
| POST | `/api/push-auth/status` | The laptop checks if you tapped "Yes" |
| GET | `/api/health` | Just checks if the server is alive |

---

## 💰 How Much This Costs

| Feature | Cost |
|---------|------|
| Google Login | **Free!** |
| Passkeys | **Free!** |
| Push Notifications | **Free!** |
| Database (MongoDB Atlas) | **Free!** |
| Node.js / Express | **Free!** |
| **Total** | **$0/month!** |

Hope you like my project! Let me know if you find any bugs!
