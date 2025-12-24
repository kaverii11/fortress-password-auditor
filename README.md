# 🛡️ Fortress AI - Cyber Security Suite

![React](https://img.shields.io/badge/React-Vite-blue?style=flat&logo=react)
![Security](https://img.shields.io/badge/Security-zxcvbn-green?style=flat&logo=security)
![Privacy](https://img.shields.io/badge/Privacy-k--Anonymity-orange)

**Fortress AI** is a professional-grade cybersecurity dashboard designed to audit, generate, and securely store passwords. Unlike simple length-checkers, it uses **semantic analysis** to detect human patterns, visualizes strength trends in real-time, and scans the Dark Web using **k-anonymity** to ensure user data never leaves the browser.

🔴 **Live Demo:** [https://fortress-password-auditor.vercel.app](https://fortress-password-auditor.vercel.app)

---

## 📸 Interface

<p align="center">
  <img width="98%" alt="Dashboard View" src="https://github.com/user-attachments/assets/ee036218-19ce-4772-bb35-ecf5d60df113" />
  
  <img width="48%" alt="Audit Analysis" src="https://github.com/user-attachments/assets/fa4ef67d-f62f-4b3a-acb1-7d9f2eca32c9" />
   <img width="48%" alt="Vault View" src="https://github.com/user-attachments/assets/bbc9f8da-2a5f-425b-b128-c48a0a3ed021" />
   
  <img width="48%" alt="Generator View" src="https://github.com/user-attachments/assets/925cdac2-f9f5-48b5-a3d1-135d6a767dcd" />
 <img width="48%" alt="Graph View" src="https://github.com/user-attachments/assets/a68588d9-b7cc-490b-b49b-e265f2e5a5a8" />
</p>
---

## 🔐 Key Features

### 1. 🧠 Semantic Analysis (The "Brain")
* Powered by **`zxcvbn`**, a realistic password strength estimator.
* Detects predictable patterns: **Keyboard walks** ("qwerty"), **L33t speak** ("P@ssw0rd"), and **Personal data** (dates, names).
* Scores passwords on a **0-4 scale** (from "Too Guessable" to "Very Strong").

### 2. 📈 Live Analytics (Cockpit View)
* **Real-time Data Viz:** Uses `Recharts` to visualize password strength improvement as you type.
* **Trend Tracking:** Shows the history of your last 10 audits to encourage stronger choices.
* **Zero-Start Logic:** Instantly visualizes strength spikes even when pasting passwords.

### 3. 🌍 Breach Detection (k-Anonymity)
* Connects to the **Have I Been Pwned (HIBP)** database of billions of leaked credentials.
* **Privacy First:**
    * We hash the password (SHA-1).
    * We send **only the first 5 characters** of the hash to the API.
    * The API returns all matches, and we check the rest locally.
    * **The real password never leaves the user's device.**

### 4. 🏦 The Vault (Local Manager)
* **Client-Side Storage:** Users can save generated passwords to their browser's `localStorage`.
* **Zero-Knowledge:** Passwords stored in the Vault exist *only* on your device. Clearing your cache wipes the vault.
* **Management:** Copy, delete, and organize your generated credentials.

### 5. 🎲 XKCD Generator
* Generates high-entropy passphrases (e.g., `Correct-Horse-Battery-Staple`) based on **XKCD 936**.
* Easier for humans to remember, mathematically harder for computers to crack.

---

## 🛠️ Tech Stack

* **Frontend:** React.js (Vite)
* **Styling:** CSS3 (Glassmorphism, Responsive Grid, Cockpit Layout)
* **Data Viz:** Recharts (Custom Line Charts)
* **Logic:** JavaScript (ES6+), LocalStorage API, Debouncing
* **Security Libs:** `zxcvbn`, `react-icons`

---

## 🚀 How to Run Locally

# 1. Clone the repository
git clone [https://github.com/kaverii11/fortress-password-auditor.git](https://github.com/kaverii11/fortress-password-auditor.git)

# 2. Install dependencies
npm install

# 3. Run the development server
npm run dev
