const BSPTCL_META = {
  organization: "Bihar State Power Transmission Company Limited (BSPTCL)",
  parentOrg: "Bihar State Power (Holding) Company Limited (BSPHCL)",
  hqAddress: "Vidyut Bhawan, Bailey Road (Jawahar Lal Nehru Marg), Patna - 800001",
  grievanceEmail: "dgrcell@bsptcl.bihar.gov.in",
  vigilanceHelpline: "0612-2505559",
  website: "https://www.bsptcl.in/",
  voltageLevels: ["400 kV", "220 kV", "132 kV", "General / Non-Technical"],
  slaHours: {
    Critical: 24,
    High: 72,
    Medium: 168,
    Low: 336
  },
  categories: [
    "Transmission Line Fault / Tripping",
    "Right of Way (RoW) & Land Compensation",
    "Grid Sub-Station (GSS) Equipment Issue",
    "Tower / Line Safety Hazard",
    "Vendor / Contractor Billing & Tender",
    "Employee / HR & Pension Grievance"
  ],
  zones: {
    "Patna Zone": {
      code: "PAT",
      nodalOfficer: "GM-cum-CE Office, Transmission Zone Patna",
      gssList: [
        "220/132/33 kV GSS Khagaul",
        "220/132/33 kV GSS Fatuha",
        "220/132/33 kV GSS Gaurichak",
        "220/132/33 kV GSS Bihta (New)",
        "132/33 kV GSS Biharshariff",
        "132/33 kV GSS Jehanabad",
        "220/132/33 kV GSS Nawada"
      ]
    },
    "Muzaffarpur Zone": {
      code: "MUZ",
      nodalOfficer: "GM-cum-CE Office, Transmission Zone Muzaffarpur",
      gssList: [
        "220/132/33 kV GSS Hajipur",
        "220/132/33 kV GSS Darbhanga",
        "220/132/33 kV GSS Gopalganj",
        "220/132/33 kV GSS Madhepura",
        "400/220/132 kV GSS Saharsa (New)",
        "132/33 kV GSS Muzaffarpur"
      ]
    },
    "Bhagalpur Zone": {
      code: "BGP",
      nodalOfficer: "GM-cum-CE Office, Transmission Zone Bhagalpur",
      gssList: [
        "220/132/33 kV GSS Begusarai",
        "132/33 kV GSS Sabour",
        "132/33 kV GSS Purnia",
        "220/132/33 kV GSS Thakurganj"
      ]
    },
    "Gaya Zone": {
      code: "GAY",
      nodalOfficer: "GM-cum-CE Office, Transmission Zone Gaya",
      gssList: [
        "220/132/33 kV GSS Bodhgaya",
        "220/132/33 kV GSS Gaya",
        "132/33 kV GSS Aurangabad"
      ]
    },
    "Dehri-on-Sone Zone": {
      code: "DOS",
      nodalOfficer: "GM-cum-CE Office, Transmission Zone Dehri-on-Sone",
      gssList: [
        "220/132/33 kV GSS Dehri-on-Sone",
        "220/132/33 kV GSS Pusauli"
      ]
    }
  }
};

// Demo Officer & Admin Accounts for Role-Based Access Control (RBAC)
const OFFICER_ACCOUNTS = [
  {
    email: "admin@bsptcl.in",
    password: "Admin@123",
    name: "Chief Engineer (HQ Monitoring Cell)",
    role: "HQ Admin",
    zone: "All"
  },
  {
    email: "patna@bsptcl.in",
    password: "Patna@123",
    name: "Nodal Officer, Patna Transmission Zone",
    role: "Zonal Nodal Officer",
    zone: "Patna Zone"
  },
  {
    email: "muz@bsptcl.in",
    password: "Muz@123",
    name: "Nodal Officer, Muzaffarpur Transmission Zone",
    role: "Zonal Nodal Officer",
    zone: "Muzaffarpur Zone"
  },
  {
    email: "bgp@bsptcl.in",
    password: "Bgp@123",
    name: "Nodal Officer, Bhagalpur Transmission Zone",
    role: "Zonal Nodal Officer",
    zone: "Bhagalpur Zone"
  },
  {
    email: "gaya@bsptcl.in",
    password: "Gaya@123",
    name: "Nodal Officer, Gaya Transmission Zone",
    role: "Zonal Nodal Officer",
    zone: "Gaya Zone"
  },
  {
    email: "dos@bsptcl.in",
    password: "Dos@123",
    name: "Nodal Officer, Dehri-on-Sone Zone",
    role: "Zonal Nodal Officer",
    zone: "Dehri-on-Sone Zone"
  }
];

const now = Date.now();
const hrs = (h) => new Date(now + h * 3600 * 1000).toISOString();

const INITIAL_GRIEVANCES = [
  {
    id: "BSPTCL-2026-PAT-1001",
    complainantName: "Rajeshwar Prasad Singh",
    complainantType: "Citizen / Landowner",
    mobile: "9431012345",
    email: "rajeshwar.singh@example.in",
    zone: "Patna Zone",
    gss: "220/132/33 kV GSS Bihta (New)",
    voltageLevel: "220 kV",
    category: "Right of Way (RoW) & Land Compensation",
    priority: "High",
    status: "In Progress",
    subject: "Pending crop & RoW compensation near Tower Loc. 42 (Bihta corridor)",
    description: "Tower foundation and stringing work on the 220 kV line near Bihta impacted standing crops. Survey verification was completed last month, awaiting disbursement status.",
    assignedTo: "Executive Engineer, Transmission Division Patna",
    attachmentName: "land_survey_receipt.pdf",
    createdAt: hrs(-80),
    slaDeadline: hrs(-8),
    escalated: false,
    resolvedAt: null,
    rating: null,
    feedback: "",
    timeline: [
      { timestamp: hrs(-80), status: "Submitted", actor: "Portal System", remark: "Grievance registered online and routed to Patna Zone." },
      { timestamp: hrs(-72), status: "Assigned", actor: "Zonal Nodal Desk (Patna)", remark: "Assigned to Executive Engineer, Transmission Division Patna for RoW verification." },
      { timestamp: hrs(-36), status: "In Progress", actor: "Executive Engineer, Patna", remark: "Revenue Circle report verified; file forwarded to Accounts for compensation release." }
    ]
  },
  {
    id: "BSPTCL-2026-MUZ-1002",
    complainantName: "Anita Kumari",
    complainantType: "Citizen / Landowner",
    mobile: "9835211009",
    email: "anita.k@example.in",
    zone: "Muzaffarpur Zone",
    gss: "220/132/33 kV GSS Hajipur",
    voltageLevel: "132 kV",
    category: "Tower / Line Safety Hazard",
    priority: "Critical",
    status: "Escalated",
    subject: "Low conductor sag & sparking near rural road crossing (Hajipur feeder)",
    description: "Observed abnormal sagging and audible corona discharge on the 132 kV overhead span crossing the village approach road after high winds.",
    assignedTo: "Chief Engineer (O&M), Vidyut Bhawan HQ",
    attachmentName: "span_photo_hajipur.jpg",
    createdAt: hrs(-30),
    slaDeadline: hrs(-6),
    escalated: true,
    resolvedAt: null,
    rating: null,
    feedback: "",
    timeline: [
      { timestamp: hrs(-30), status: "Submitted", actor: "Portal System", remark: "Critical safety ticket logged with 24-hour SLA." },
      { timestamp: hrs(-28), status: "Assigned", actor: "Zonal Nodal Desk (Muzaffarpur)", remark: "Emergency line patrol team alerted at GSS Hajipur." },
      { timestamp: hrs(-5), status: "Escalated", actor: "Auto-SLA Monitor", remark: "SLA exceeded (24h). Escalated to HQ O&M Monitoring Cell, Vidyut Bhawan." }
    ]
  },
  {
    id: "BSPTCL-2026-BGP-1003",
    complainantName: "Sandeep Kumar Verma",
    complainantType: "DISCOM / Open Access Consumer",
    mobile: "9934098765",
    email: "sandeep.verma@example.in",
    zone: "Bhagalpur Zone",
    gss: "132/33 kV GSS Sabour",
    voltageLevel: "132 kV",
    category: "Transmission Line Fault / Tripping",
    priority: "High",
    status: "Resolved",
    subject: "Frequent 33 kV bay tripping at GSS Sabour during peak evening hours",
    description: "Three consecutive transient trips recorded on outgoing 33 kV feeder bays impacting downstream distribution reliability.",
    assignedTo: "Assistant Executive Engineer, GSS Sabour",
    attachmentName: "tripping_log_oct.xlsx",
    createdAt: hrs(-96),
    slaDeadline: hrs(-24),
    escalated: false,
    resolvedAt: hrs(-30),
    rating: null,
    feedback: "",
    timeline: [
      { timestamp: hrs(-96), status: "Submitted", actor: "Portal System", remark: "Ticket registered and routed to Bhagalpur Zone." },
      { timestamp: hrs(-88), status: "Assigned", actor: "Zonal Nodal Desk (Bhagalpur)", remark: "Testing & Commissioning (T&C) team assigned." },
      { timestamp: hrs(-60), status: "In Progress", actor: "AEE, GSS Sabour", remark: "Relay coordination checked; faulty CT terminal replaced during planned shutdown." },
      { timestamp: hrs(-30), status: "Resolved", actor: "AEE, GSS Sabour", remark: "Feeder energized and monitored stable for 24 hours." }
    ]
  },
  {
    id: "BSPTCL-2026-GAY-1004",
    complainantName: "M/s Magadh Infra Projects",
    complainantType: "Contractor / Vendor",
    mobile: "9304556677",
    email: "billing@magadhinfra.example.in",
    zone: "Gaya Zone",
    gss: "220/132/33 kV GSS Bodhgaya",
    voltageLevel: "220 kV",
    category: "Vendor / Contractor Billing & Tender",
    priority: "Medium",
    status: "Assigned",
    subject: "RA Bill #04 verification pending for SAS panel room civil works",
    description: "Measurement book and GST invoice submitted at Division office 18 days ago; requesting status update on Accounts clearance.",
    assignedTo: "Accounts Officer, Transmission Circle Gaya",
    attachmentName: "RA_Bill_04_Bodhgaya.pdf",
    createdAt: hrs(-48),
    slaDeadline: hrs(120),
    escalated: false,
    resolvedAt: null,
    rating: null,
    feedback: "",
    timeline: [
      { timestamp: hrs(-48), status: "Submitted", actor: "Portal System", remark: "Vendor grievance registered under Gaya Zone." },
      { timestamp: hrs(-40), status: "Assigned", actor: "Zonal Nodal Desk (Gaya)", remark: "Forwarded to Accounts Officer, Transmission Circle Gaya." }
    ]
  },
  {
    id: "BSPTCL-2026-DOS-1005",
    complainantName: "Vikramaditya Tiwari",
    complainantType: "BSPTCL Employee",
    mobile: "9431887766",
    email: "v.tiwari@example.in",
    zone: "Dehri-on-Sone Zone",
    gss: "220/132/33 kV GSS Dehri-on-Sone",
    voltageLevel: "General / Non-Technical",
    category: "Employee / HR & Pension Grievance",
    priority: "Low",
    status: "Closed",
    subject: "Medical reimbursement claim & service book entry update",
    description: "Submitted original hospital bills for family medical reimbursement under BSPHCL employee rules; requesting confirmation of sanction.",
    assignedTo: "HR & Administration Cell, Vidyut Bhawan",
    attachmentName: "medical_claim_set.pdf",
    createdAt: hrs(-210),
    slaDeadline: hrs(126),
    escalated: false,
    resolvedAt: hrs(-110),
    rating: 4,
    feedback: "Sanction order issued and amount credited.",
    timeline: [
      { timestamp: hrs(-210), status: "Submitted", actor: "Portal System", remark: "HR grievance registered." },
      { timestamp: hrs(-180), status: "In Progress", actor: "HR Cell, HQ", remark: "Bills verified with Chief Medical Officer." },
      { timestamp: hrs(-110), status: "Resolved", actor: "HR Cell, HQ", remark: "Reimbursement sanctioned vide Office Order." },
      { timestamp: hrs(-100), status: "Closed", actor: "Complainant", remark: "Feedback submitted (4/5) and ticket closed." }
    ]
  },
  {
    id: "BSPTCL-2026-MUZ-1006",
    complainantName: "Prakash Narayan Jha",
    complainantType: "DISCOM / Open Access Consumer",
    mobile: "9122334455",
    email: "pn.jha@example.in",
    zone: "Muzaffarpur Zone",
    gss: "400/220/132 kV GSS Saharsa (New)",
    voltageLevel: "400 kV",
    category: "Grid Sub-Station (GSS) Equipment Issue",
    priority: "High",
    status: "Submitted",
    subject: "ABT Energy Meter telemetry sync delay on 132 kV outgoing bay",
    description: "Intermittent telemetry lag observed between ABT meter data and SLDC SCADA dashboard for 132 kV feeder bay #02.",
    assignedTo: "Zonal Nodal Desk (Muzaffarpur)",
    attachmentName: "scada_telemetry_screenshot.png",
    createdAt: hrs(-10),
    slaDeadline: hrs(62),
    escalated: false,
    resolvedAt: null,
    rating: null,
    feedback: "",
    timeline: [
      { timestamp: hrs(-10), status: "Submitted", actor: "Portal System", remark: "Ticket logged for 400/220/132 kV GSS Saharsa (New)." }
    ]
  },
  {
    id: "BSPTCL-2026-PAT-1007",
    complainantName: "Md. Irfan Alam",
    complainantType: "Citizen / Landowner",
    mobile: "9835001122",
    email: "irfan.alam@example.in",
    zone: "Patna Zone",
    gss: "220/132/33 kV GSS Khagaul",
    voltageLevel: "220 kV",
    category: "Grid Sub-Station (GSS) Equipment Issue",
    priority: "Medium",
    status: "Resolved",
    subject: "Boundary wall drainage waterlogging near GSS Khagaul service road",
    description: "Stormwater outflow from the substation perimeter drain caused waterlogging along the adjacent residential lane.",
    assignedTo: "Civil Maintenance Wing, Patna Zone",
    attachmentName: "drainage_site.jpg",
    createdAt: hrs(-140),
    slaDeadline: hrs(28),
    escalated: false,
    resolvedAt: hrs(-20),
    rating: 5,
    feedback: "Drainage culvert cleaned and repaired within 5 days.",
    timeline: [
      { timestamp: hrs(-140), status: "Submitted", actor: "Portal System", remark: "Ticket logged under Patna Zone." },
      { timestamp: hrs(-115), status: "Assigned", actor: "Zonal Nodal Desk (Patna)", remark: "Routed to Civil Maintenance Wing." },
      { timestamp: hrs(-60), status: "In Progress", actor: "Civil Wing, Patna", remark: "Culvert desilting and concrete apron work initiated." },
      { timestamp: hrs(-20), status: "Resolved", actor: "Civil Wing, Patna", remark: "Work completed and site inspected." }
    ]
  },
  {
    id: "BSPTCL-2026-BGP-1008",
    complainantName: "Kundan Kumar Mandal",
    complainantType: "Citizen / Landowner",
    mobile: "9708112233",
    email: "kundan.mandal@example.in",
    zone: "Bhagalpur Zone",
    gss: "220/132/33 kV GSS Begusarai",
    voltageLevel: "220 kV",
    category: "Tower / Line Safety Hazard",
    priority: "Critical",
    status: "In Progress",
    subject: "Damaged anti-climbing device & warning plate missing on Tower #18",
    description: "Anti-climbing barbed guard is loose and danger plate is missing on 220 kV tower near school playground.",
    assignedTo: "Transmission Maintenance Sub-Division, Begusarai",
    attachmentName: "tower18_safety.jpg",
    createdAt: hrs(-12),
    slaDeadline: hrs(12),
    escalated: false,
    resolvedAt: null,
    rating: null,
    feedback: "",
    timeline: [
      { timestamp: hrs(-12), status: "Submitted", actor: "Portal System", remark: "Critical safety ticket logged under Bhagalpur Zone." },
      { timestamp: hrs(-9), status: "Assigned", actor: "Zonal Nodal Desk (Bhagalpur)", remark: "Maintenance crew dispatched from Begusarai." },
      { timestamp: hrs(-4), status: "In Progress", actor: "JE Maintenance, Begusarai", remark: "Replacement danger board and anti-climbing guard procured; fitting in progress." }
    ]
  }
];

export { BSPTCL_META, OFFICER_ACCOUNTS, INITIAL_GRIEVANCES };
