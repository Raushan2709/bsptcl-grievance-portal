BSPTCL — Web-Based Grievance Redressal & Monitoring Portal

A full-stack Grievance Redressal and SLA Monitoring Portal built for Bihar State Power Transmission Company Limited (BSPTCL), a subsidiary of Bihar State Power (Holding) Company Limited (BSPHCL). The portal streamlines complaint registration, real-time status tracking, zone-scoped officer redressal, and automated SLA escalation across BSPTCL's 5 Transmission Zones (Patna, Muzaffarpur, Bhagalpur, Gaya, and Dehri-on-Sone).

Live Demo: [Paste your Vercel URL here]

Key Features

Public Transparency Dashboard: Real-time KPI cards, Transmission Zone-wise Bar Chart (Active vs. Resolved), and Category-wise Donut Chart powered by Recharts without exposing private citizen PII.

Smart Grievance Lodging: Dynamic Transmission Zone → Grid Sub-Station (GSS) cascading dropdowns, voltage level tagging (400 kV, 220 kV, 132 kV), priority-based SLA calculation (24h Critical, 72h High, 7d Medium, 14d Low), and instant Tracking ID generation (BSPTCL-YYYY-ZONE-XXXX).

Real-Time Status Tracker & Feedback: Citizens can track tickets by Tracking ID or 10-digit mobile number, view the complete chronological audit timeline, request HQ escalation, and submit 5-star closure feedback on resolved tickets.

Role-Based Access Control (RBAC):

Public Citizen: Can lodge grievances, track own tickets, and view aggregate state-wide statistics.

Zonal Nodal Officer: Authenticated via HMAC-signed Bearer tokens; restricted to viewing and updating grievances within their assigned Transmission Zone.

HQ Admin (Vidyut Bhawan, Patna): Full visibility across all 5 zones, 1-click Auto-Escalation Sweep for SLA-breached tickets, and filtered CSV Report Export.

Bilingual Support: Instant English / हिंदी header and navigation toggle.

Tech Stack

Frontend: React 18, Vite, Tailwind CSS, Recharts, Lucide React

Backend: Node.js, Express.js (REST API + Vercel Serverless Function)

Authentication & Security: Custom HMAC-SHA256 signed tokens (crypto), Role-Based Access Control middleware (requireOfficer, requireHqAdmin)

Deployment: Unified single-project deployment on Vercel (vercel.json + /api/index.js)

Project Structure

bsptcl-grievance-portal-vercel/
├── api/
│   └── index.js                # Vercel serverless entrypoint
├── server/
│   ├── app.js                  # Express REST API, RBAC middleware & SLA engine
│   ├── local.js                # Local Node.js server runner (port 5000)
│   └── data/
│       └── seedData.js         # BSPTCL Zones, GSS list, RBAC accounts & sample tickets
├── src/
│   ├── api/
│   │   └── client.js           # Fetch API wrapper with Bearer token handling
│   ├── App.jsx                 # Complete React UI (Dashboard, Lodge, Track, Officer Console)
│   ├── main.jsx                # React root mount
│   └── index.css               # Tailwind CSS entry
├── index.html
├── package.json
├── vercel.json                 # Routes /api/* to Express and SPA routes to index.html
└── vite.config.js
