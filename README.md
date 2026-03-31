# 🏙️ Civic Issue Reporting & Resolution System

A full-stack platform that bridges the gap between citizens and local authorities. Citizens can report public infrastructure problems (potholes, broken streetlights, waste management issues) while administrators manage, assign, and resolve them efficiently.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | React 19 + Vite |
| **Styling** | Tailwind CSS |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB + Mongoose |
| **Real-time** | Socket.IO |
| **Auth** | express-session + connect-mongo |
| **Storage** | Cloudinary |
| **Email** | Nodemailer + Resend |
| **AI Chatbot** | Claude API (Anthropic) |
| **Maps** | Mapbox |

---

## ✨ Features

### Issue Reporting
- Report issues with **auto-detected geolocation** (lat/long + address) visualized on a Mapbox map
- Categorize issues: *Garbage, Pothole, Streetlight, Water Leakage*
- Upload photos (via Multer → Cloudinary)
- Track status: `Pending` → `In Progress` → `Resolved`

### Admin & Workflow
- **Three roles**: Citizen, Department Admin, Super Admin
- Super Admins assign issues to Department Admins with workload balancing
- Escalation support for unresolved or high-priority issues
- Full activity log for transparency

### Dashboard & Analytics
- Charts and trends via **Recharts**
- Department performance metrics

### User Engagement
- **Real-time notifications** via Socket.IO
- **AI-powered chatbot** to help users report issues or query civic services
- **Comment/discussion threads** per issue

---

## 📂 Project Structure
```text
Capstone - Project/
├── Backend/
│   ├── Config/       # DB, Mailer, Cloudinary setup
│   ├── Controllers/  # Business logic (Users, Issues, Analytics)
│   ├── Models/       # Mongoose schemas (User, Issue, Notification, ActivityLog)
│   ├── Routes/       # API endpoint definitions
│   └── server.js     # Express entry point
└── frontend/
    ├── src/          # React components, pages, hooks
    ├── public/       # Static assets
    ├── vite.config.js
    └── tailwind.config.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Cloudinary account
- Resend API key

### Installation
```bash
# Clone the repo
git clone https://github.com/your-username/civic-issue-reporting.git

# Backend
cd Backend
npm install
cp .env.example .env   # Fill in your environment variables
npm run dev

# Frontend
cd ../frontend
npm install
npm run dev
```

---

## 📄 License

MIT
