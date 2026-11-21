import express from "express";
import cors from "cors";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

import { BSPTCL_META, OFFICER_ACCOUNTS, INITIAL_GRIEVANCES } from "./data/seedData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const AUTH_SECRET = process.env.AUTH_SECRET || "bsptcl_internship_portal_secret_2026";
const IS_VERCEL = Boolean(process.env.VERCEL);
const DB_PATH = IS_VERCEL
  ? path.join("/tmp", "bsptcl_grievances.json")
  : path.join(__dirname, "data", "grievances.json");

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json({ limit: "2mb" }));

// In-memory fallback for serverless warm invocations
let memoryStore = null;

function loadGrievances() {
  if (fs.existsSync(DB_PATH)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      memoryStore = parsed;
      return parsed;
    } catch {
      // fall through
    }
  }
  if (memoryStore) return memoryStore;
  const seeded = JSON.parse(JSON.stringify(INITIAL_GRIEVANCES));
  memoryStore = seeded;
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(seeded, null, 2), "utf-8");
  } catch {
    // ignore read-only fs errors; memoryStore stays active
  }
  return seeded;
}

function saveGrievances(list) {
  memoryStore = list;
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(list, null, 2), "utf-8");
  } catch {
    // keep in-memory store if filesystem is read-only
  }
}

// --- Signed Token Auth (No external JWT dependency) ---
function signToken(payload) {
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 12 * 3600 * 1000 })).toString("base64url");
  const sig = crypto.createHmac("sha256", AUTH_SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  const [data, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", AUTH_SECRET).update(data).digest("base64url");
  if (sig !== expected) return null;
  try {
    const parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (parsed.exp && parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function requireOfficer(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: "Officer authentication required. Please log in." });
  }
  req.user = user;
  next();
}

function requireHqAdmin(req, res, next) {
  requireOfficer(req, res, () => {
    if (req.user.role !== "HQ Admin") {
      return res.status(403).json({ error: "Access denied. HQ Admin (Vidyut Bhawan) privileges required." });
    }
    next();
  });
}

function isSlaBreached(g) {
  if (g.status === "Resolved" || g.status === "Closed") return false;
  return new Date(g.slaDeadline).getTime() < Date.now();
}

function generateTrackingId(zone, existingList) {
  const zoneInfo = BSPTCL_META.zones[zone] || { code: "GEN" };
  const year = new Date().getFullYear();
  const nextNum = 1001 + existingList.length;
  return `BSPTCL-${year}-${zoneInfo.code}-${nextNum}`;
}

// --- AUTH ROUTES ---
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const account = OFFICER_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === String(email || "").trim().toLowerCase() && a.password === password
  );
  if (!account) {
    return res.status(401).json({ error: "Invalid officer email or password." });
  }
  const user = { name: account.name, email: account.email, role: account.role, zone: account.zone };
  const token = signToken(user);
  res.json({ token, user });
});

app.get("/api/auth/me", requireOfficer, (req, res) => {
  res.json({ user: req.user });
});

// --- PUBLIC ROUTES ---
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "BSPTCL Grievance Portal API (Vercel Ready)",
    runtime: IS_VERCEL ? "vercel-serverless" : "local-node",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/meta", (req, res) => {
  res.json(BSPTCL_META);
});

app.get("/api/grievances/stats", (req, res) => {
  const list = loadGrievances();
  const total = list.length;
  const open = list.filter((g) => ["Submitted", "Assigned"].includes(g.status)).length;
  const inProgress = list.filter((g) => g.status === "In Progress").length;
  const escalated = list.filter((g) => g.status === "Escalated" || g.escalated).length;
  const resolved = list.filter((g) => ["Resolved", "Closed"].includes(g.status)).length;
  const slaBreached = list.filter(isSlaBreached).length;

  const resolvedWithTime = list.filter((g) => g.resolvedAt && g.createdAt);
  const avgResolutionHours = resolvedWithTime.length
    ? Math.round(
        resolvedWithTime.reduce(
          (acc, g) => acc + (new Date(g.resolvedAt) - new Date(g.createdAt)) / 36e5,
          0
        ) / resolvedWithTime.length
      )
    : 0;

  const byZone = Object.keys(BSPTCL_META.zones).map((zone) => {
    const zItems = list.filter((g) => g.zone === zone);
    return {
      zone: zone.replace(" Zone", ""),
      fullZone: zone,
      active: zItems.filter((g) => !["Resolved", "Closed"].includes(g.status)).length,
      resolved: zItems.filter((g) => ["Resolved", "Closed"].includes(g.status)).length,
      total: zItems.length
    };
  });

  const byCategory = BSPTCL_META.categories
    .map((cat) => ({
      name: cat,
      value: list.filter((g) => g.category === cat).length
    }))
    .filter((c) => c.value > 0);

  res.json({ total, open, inProgress, escalated, resolved, slaBreached, avgResolutionHours, byZone, byCategory });
});

app.get("/api/grievances/track/:query", (req, res) => {
  const q = req.params.query.trim().toLowerCase();
  const list = loadGrievances();
  const matches = list.filter((g) => g.id.toLowerCase() === q || g.mobile === q);
  if (!matches.length) {
    return res.status(404).json({ error: "No grievance found matching that Tracking ID or Mobile Number." });
  }
  res.json(matches);
});

app.post("/api/grievances", (req, res) => {
  const {
    complainantName,
    complainantType,
    mobile,
    email,
    zone,
    gss,
    voltageLevel,
    category,
    priority,
    subject,
    description,
    attachmentName
  } = req.body;

  if (!complainantName || !mobile || !zone || !category || !subject || !description) {
    return res.status(400).json({ error: "Please fill all required fields." });
  }
  if (!/^[6-9]\d{9}$/.test(String(mobile).trim())) {
    return res.status(400).json({ error: "Please enter a valid 10-digit Indian mobile number." });
  }

  const list = loadGrievances();
  const nowIso = new Date().toISOString();
  const slaHrs = BSPTCL_META.slaHours[priority] || 168;
  const slaDeadline = new Date(Date.now() + slaHrs * 3600 * 1000).toISOString();
  const id = generateTrackingId(zone, list);
  const nodalOfficer = (BSPTCL_META.zones[zone] && BSPTCL_META.zones[zone].nodalOfficer) || "HQ Grievance Cell";

  const newTicket = {
    id,
    complainantName: complainantName.trim(),
    complainantType: complainantType || "Citizen / Landowner",
    mobile: String(mobile).trim(),
    email: (email || "").trim(),
    zone,
    gss: gss || "General / Zonal Office",
    voltageLevel: voltageLevel || "132 kV",
    category,
    priority: priority || "Medium",
    status: "Submitted",
    subject: subject.trim(),
    description: description.trim(),
    assignedTo: nodalOfficer,
    attachmentName: attachmentName || "",
    createdAt: nowIso,
    slaDeadline,
    escalated: false,
    resolvedAt: null,
    rating: null,
    feedback: "",
    timeline: [
      {
        timestamp: nowIso,
        status: "Submitted",
        actor: "Portal System",
        remark: `Grievance registered online and auto-routed to ${nodalOfficer} (SLA: ${slaHrs}h).`
      }
    ]
  };

  list.unshift(newTicket);
  saveGrievances(list);
  res.status(201).json(newTicket);
});

app.post("/api/grievances/:id/feedback", (req, res) => {
  const { id } = req.params;
  const { rating, feedback } = req.body;
  const list = loadGrievances();
  const idx = list.findIndex((g) => g.id === id);
  if (idx === -1) return res.status(404).json({ error: "Grievance not found." });

  const ticket = list[idx];
  ticket.rating = Number(rating) || 5;
  ticket.feedback = (feedback || "").trim();
  ticket.status = "Closed";
  ticket.timeline.push({
    timestamp: new Date().toISOString(),
    status: "Closed",
    actor: ticket.complainantName,
    remark: `Citizen feedback submitted (${ticket.rating}/5)${ticket.feedback ? `: ${ticket.feedback}` : "."}`
  });

  list[idx] = ticket;
  saveGrievances(list);
  res.json(ticket);
});

app.post("/api/grievances/:id/escalate", (req, res) => {
  const { id } = req.params;
  const list = loadGrievances();
  const idx = list.findIndex((g) => g.id === id);
  if (idx === -1) return res.status(404).json({ error: "Grievance not found." });

  const ticket = list[idx];
  ticket.escalated = true;
  ticket.status = "Escalated";
  ticket.assignedTo = "Chief Engineer (O&M) / HQ Grievance Cell, Vidyut Bhawan";
  ticket.timeline.push({
    timestamp: new Date().toISOString(),
    status: "Escalated",
    actor: ticket.complainantName,
    remark: "Complainant requested escalation to HQ Monitoring Cell, Vidyut Bhawan Patna."
  });

  list[idx] = ticket;
  saveGrievances(list);
  res.json(ticket);
});

// --- PROTECTED OFFICER & ADMIN ROUTES ---
app.get("/api/grievances", requireOfficer, (req, res) => {
  const { zone, status, priority, category, search, slaBreached } = req.query;
  let list = loadGrievances();

  if (req.user.role === "Zonal Nodal Officer") {
    list = list.filter((g) => g.zone === req.user.zone);
  } else if (zone && zone !== "All") {
    list = list.filter((g) => g.zone === zone);
  }

  if (status && status !== "All") list = list.filter((g) => g.status === status);
  if (priority && priority !== "All") list = list.filter((g) => g.priority === priority);
  if (category && category !== "All") list = list.filter((g) => g.category === category);
  if (slaBreached === "true") list = list.filter(isSlaBreached);

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (g) =>
        g.id.toLowerCase().includes(q) ||
        g.complainantName.toLowerCase().includes(q) ||
        g.mobile.includes(q) ||
        g.subject.toLowerCase().includes(q) ||
        g.gss.toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

app.patch("/api/grievances/:id", requireOfficer, (req, res) => {
  const { id } = req.params;
  const { status, assignedTo, remark } = req.body;
  const list = loadGrievances();
  const idx = list.findIndex((g) => g.id === id);
  if (idx === -1) return res.status(404).json({ error: "Grievance not found." });

  const ticket = list[idx];
  if (req.user.role === "Zonal Nodal Officer" && ticket.zone !== req.user.zone) {
    return res.status(403).json({ error: `Access denied. You can only manage ${req.user.zone} grievances.` });
  }

  const nowIso = new Date().toISOString();
  if (status) ticket.status = status;
  if (assignedTo) ticket.assignedTo = assignedTo;
  if (status === "Resolved" && !ticket.resolvedAt) {
    ticket.resolvedAt = nowIso;
  }

  ticket.timeline.push({
    timestamp: nowIso,
    status: ticket.status,
    actor: `${req.user.name} (${req.user.role})`,
    remark: remark && remark.trim() ? remark.trim() : `Status updated to ${ticket.status}.`
  });

  list[idx] = ticket;
  saveGrievances(list);
  res.json(ticket);
});

app.post("/api/grievances/auto-escalate", requireHqAdmin, (req, res) => {
  const list = loadGrievances();
  let count = 0;
  const nowIso = new Date().toISOString();

  const updated = list.map((g) => {
    if (isSlaBreached(g) && g.status !== "Escalated") {
      count += 1;
      return {
        ...g,
        status: "Escalated",
        escalated: true,
        assignedTo: "HQ Monitoring Cell, Vidyut Bhawan Patna",
        timeline: [
          ...g.timeline,
          {
            timestamp: nowIso,
            status: "Escalated",
            actor: "Auto-SLA Escalation Engine (HQ Admin)",
            remark: "SLA deadline breached. Automatically escalated to HQ Monitoring Cell, Vidyut Bhawan."
          }
        ]
      };
    }
    return g;
  });

  saveGrievances(updated);
  res.json({ escalatedCount: count, grievances: updated });
});

app.delete("/api/grievances/:id", requireHqAdmin, (req, res) => {
  const { id } = req.params;
  const list = loadGrievances();
  const filtered = list.filter((g) => g.id !== id);
  if (filtered.length === list.length) return res.status(404).json({ error: "Grievance not found." });
  saveGrievances(filtered);
  res.json({ deleted: id });
});

export default app;
