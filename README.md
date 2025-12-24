# 🛡️ Fortress AI - Semantic Password Auditor

![React](https://img.shields.io/badge/React-Vite-blue)
![Security](https://img.shields.io/badge/Security-zxcvbn-green)
![API](https://img.shields.io/badge/API-HaveIBeenPwned-orange)

**Fortress AI** is a modern cybersecurity dashboard that goes beyond simple "length checks." It uses **semantic analysis** to detect predictable human patterns and scans the Dark Web for breached passwords without ever exposing user data.

🔴 **Live Demo:** https://vercel.com/kaveris-projects-05989914/fortress-password-auditor
---

## 📸 Screenshots

<div style="display: flex; justify-content: center; gap: 10px;">
  <img src="[LINK_TO_AUDITOR_SCREENSHOT]" width="48%" />
  <img src="[LINK_TO_GENERATOR_SCREENSHOT]" width="48%" />
</div>


---

## 🔐 Key Features

### 1. 🧠 Semantic Analysis (The "Brain")
* Unlike regex-based checkers, Fortress uses **`zxcvbn`**, a heuristic engine that detects:
    * **Keyboard patterns** (e.g., "qwerty", "qazwsx").
    * **L33t speak** (e.g., "P@ssw0rd").
    * **Personal info** (dates, years, common names).
* It calculates the **Entropy** (mathematical randomness) to estimate "Time to Crack."

### 2. 🌍 Breach Detection (k-Anonymity)
* Connects to the **Have I Been Pwned (HIBP)** database containing billions of leaked passwords.
* **Privacy First:** Uses **k-anonymity**. 
    * We hash the password (SHA-1).
    * We send **only the first 5 characters** of the hash to the API.
    * The API returns all matches, and we check the rest locally.
    * **The real password never leaves the user's browser.**

### 3. 🎲 XKCD Generator
* Generates high-entropy, memorable passphrases (e.g., `Correct-Horse-Battery-Staple`).
* Based on the famous [XKCD 936](https://xkcd.com/936/) comic logic: easier for humans to remember, harder for computers to guess.

---

## 🛠️ Tech Stack

* **Frontend:** React.js (Vite)
* **Styling:** CSS3 (Custom Dark Mode)
* **Logic:** JavaScript (ES6+), Debouncing
* **Libraries:** `zxcvbn` (Dropbox), `react-icons`

---

## 🚀 How to Run Locally


# 1. Clone the repo
git clone [https://github.com/YOUR_USERNAME/fortress-password-auditor.git](https://github.com/YOUR_USERNAME/fortress-password-auditor.git)

# 2. Install dependencies
npm install

# 3. Run the dev server
npm run dev
