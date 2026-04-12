
# 🌍 Shema Humanitarian Service Platform
https://www.shemahumantarianservice.org

> Empowering communities through technology, partnerships, and advocacy.

---

## 🖼️ Preview

<img width="1358" height="717" alt="Screenshot 2026-04-10 231339" src="https://github.com/user-attachments/assets/06234e31-c765-4fbc-a697-95e999524cc8" />
<img width="1358" height="728" alt="Screenshot 2026-04-10 231431" src="https://github.com/user-attachments/assets/a937cf74-d1aa-4f56-a30c-172a4055a257" />
<img width="1365" height="731" alt="Screenshot 2026-04-10 231511" src="https://github.com/user-attachments/assets/5f27b2e1-2725-4379-b680-c43bb000295f" />
<img width="1328" height="726" alt="Screenshot 2026-04-10 231406" src="https://github.com/user-attachments/assets/ce2e19e7-b56b-4394-9823-27981d45ee75" />
<img width="1361" height="728" alt="Screenshot 2026-04-10 231459" src="https://github.com/user-attachments/assets/e81388b3-12c4-413b-ac4b-ad9a843ed8c0" />
<img width="1365" height="723" alt="Screenshot 2026-04-10 231542" src="https://github.com/user-attachments/assets/41dcda41-38cb-4914-aa11-772a67928b3d" />



* Homepage
* Partnership Form
* Email Notification
* Mobile View



---

## ✨ About the Project

**Shema Humanitarian Service Platform** is a modern web application built to support humanitarian efforts by enabling:

* Seamless communication with partners
* Efficient inquiry handling
* Automated email responses
* Digital presence for impact-driven outreach

This platform bridges the gap between **community needs and global support systems**.

---

## 🚀 Key Features

### 📩 Smart Inquiry System

* Users submit partnership requests
* Admin receives structured email instantly
* Auto-response sent to users

---

### ✉️ Email System (Production Ready)

* Domain-authenticated emails
* Custom sender identity
* `replyTo` configured for direct communication
* Built using **Resend**

---

### 🌐 Performance & Deployment

* Fast global delivery via **Vercel**
* Optimized for speed and responsiveness

---

### 🌍 Domain & Infrastructure

* Managed via **Spaceship**
* Fully configured DNS (SPF, DKIM, DMARC)

---

## 🧠 System Architecture

```text
User → Frontend (Form) → API Route → Resend → Email Delivery
                                     ↙        ↘
                              Admin Email   User Confirmation
```

---

## 🛠️ Tech Stack

| Layer      | Technology         |
| ---------- | ------------------ |
| Frontend   | React / Next.js    |
| Backend    | Next.js API Routes |
| Email      | Resend API         |
| Deployment | Vercel             |
| Domain/DNS | Spaceship          |

---

## 📂 Project Structure

```bash
/app
  /api
    /email
/components
/hooks
/utils
/public
```

---

## ⚙️ Environment Variables

Create a `.env.local` file:

```env
RESEND_API_KEY=your_resend_api_key
```

---

## ▶️ Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run development server

```bash
npm run dev
```

### 3. Open in browser

```bash
http://localhost:3000
```

---

## 📧 Email Flow Explained

### 🔹 Admin Notification

* Sent to organization email
* Contains full inquiry details
* Uses:

```ts
replyTo: userEmail
```

👉 Allows direct reply to sender

---

### 🔹 User Confirmation

* Sent to user email
* Confirms submission
* Builds trust and engagement

---

## 🔐 Security & Reliability

* ✅ Domain verified (SPF, DKIM, DMARC)
* ✅ Server-side email handling
* ✅ Input validation
* ✅ Safe API key usage via environment variables

---

## 📈 Future Enhancements

* 🎯 Admin dashboard for managing inquiries
* 📊 Analytics integration
* 🌐 Multi-language support
* 📱 Mobile application (React Native)
* ✉️ Email branding (BIMI logo support)

---

## 🤝 Contribution

Contributions are welcome!

```bash
git fork
git clone
git commit
git push
```

---

## 👨‍💻 Author

**Richard Yohanna**

* Software Developer
* AI & Full-Stack Enthusiast

---

## ❤️ About Shema

Shema Humanitarian Service is dedicated to:

* Supporting widows and vulnerable communities
* Promoting education and mentorship
* Creating sustainable impact through empowerment

---

## 📬 Contact

📧 [info@shemahumanitarianservice.org](mailto:info@shemahumanitarianservice.org)

---

## ⭐ Show Your Support

If you like this project:

👉 Star the repo
👉 Share it
👉 Contribute

---



```md
![Next.js](https://img.shields.io/badge/Next.js-000?logo=next.js)
![Vercel](https://img.shields.io/badge/Vercel-black?logo=vercel)
![Resend](https://img.shields.io/badge/Email-Resend-blue)
![License](https://img.shields.io/badge/license-MIT-green)
```

---




