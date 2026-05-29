import React from 'react';

export default function HomePage() {
  return (
    <main style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto', color: 'var(--ink)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', marginBottom: '40px' }}>
        Different authentication types
      </h1>
      
      <ul style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <li style={{ paddingLeft: '8px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
            Google Social Login (OAuth 2.0 & OIDC)
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--ink-soft)', lineHeight: 1.8, margin: 0 }}>
            Allows users to authenticate using their existing Google account. It uses the OAuth 2.0 framework combined with OpenID Connect to securely verify identity and issue a signed token without exposing passwords.
          </p>
        </li>

        <li style={{ paddingLeft: '8px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
            Passkeys (FIDO2 / WebAuthn)
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--ink-soft)', lineHeight: 1.8, margin: 0 }}>
            A modern, passwordless standard that uses public-key cryptography and device-level biometrics (like Face ID, Touch ID, or Windows Hello) to authenticate users. It is highly secure and entirely phishing-resistant.
          </p>
        </li>

        <li style={{ paddingLeft: '8px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
            Push Notification Login (Web Push API)
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--ink-soft)', lineHeight: 1.8, margin: 0 }}>
            A modern, one-click login method that sends a push notification to your registered device. You simply tap "Approve" to sign in — no password, no biometric, no OTP. It uses the Web Push API with VAPID authentication and cryptographic request tokens to ensure only your device can approve the login.
          </p>
        </li>

        <li style={{ paddingLeft: '8px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
            Magic Links
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--ink-soft)', lineHeight: 1.8, margin: 0 }}>
            A passwordless method where the user enters their email address, and the system sends them a unique, time-sensitive link. Clicking the link authenticates the user instantly, removing the need to remember passwords.
          </p>
        </li>

        <li style={{ paddingLeft: '8px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
            One-Time Passwords (OTP)
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--ink-soft)', lineHeight: 1.8, margin: 0 }}>
            A temporary, automatically generated code sent via SMS, email, or an authenticator app. It is usually valid for a single session or a very short time frame, often used to verify phone numbers or as a second factor.
          </p>
        </li>

        <li style={{ paddingLeft: '8px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
            Multi-Factor Authentication (MFA)
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--ink-soft)', lineHeight: 1.8, margin: 0 }}>
            Enhances security by requiring two or more distinct forms of verification before granting access. This usually combines something you know (a password), something you have (a smartphone), or something you are (biometrics).
          </p>
        </li>

        <li style={{ paddingLeft: '8px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
            Single Sign-On (SSO)
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--ink-soft)', lineHeight: 1.8, margin: 0 }}>
            Primarily used in enterprise environments, SSO allows users to log into multiple independent applications with a single set of credentials, typically using protocols like SAML or Enterprise OAuth.
          </p>
        </li>
      </ul>
    </main>
  );
}
