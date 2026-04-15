const sampleData = {
  project_name: "Internal Procurement Request System",
  business_context: "Mid-size retail company with 40 branches and centralized procurement operations.",
  problem_statement: "Purchase requests are managed through spreadsheets, email, and chat, causing slow approvals and weak auditability.",
  business_goal: "Reduce approval turnaround from 3 days to same-day and provide a traceable procurement request workflow.",
  success_metrics: [
    "80% of requests approved within the same business day",
    "100% of requests have approval history and requester visibility",
    "Reduce manual follow-up by procurement staff by 50%"
  ],
  users: [
    { role: "Store Staff", description: "Creates procurement requests" },
    { role: "Branch Manager", description: "Approves branch requests" }
  ],
  stakeholders: [
    { name: "Head of Procurement", role: "Business Owner", influence: "high" },
    { name: "Finance Manager", role: "Approver", influence: "high" }
  ],
  current_process: [
    "Requester fills spreadsheet and sends it by email",
    "Manager reviews and replies by email or chat",
    "Procurement consolidates approved requests manually"
  ],
  pain_points: [
    "Approval status is unclear",
    "Requests are missed in email threads",
    "Audit history is incomplete"
  ],
  must_have_features: [
    "Request submission",
    "Multi-level approval workflow",
    "Status tracking",
    "Audit log",
    "Email notifications"
  ],
  nice_to_have_features: [
    "Mobile approval",
    "Analytics dashboard"
  ],
  reports: [
    "Pending approvals by approver",
    "Request aging report"
  ],
  integrations: [
    { system_name: "ERP", purpose: "Master data sync", direction: "inbound" },
    { system_name: "Email Server", purpose: "Notifications", direction: "outbound" }
  ],
  constraints: [
    "MVP must launch within 10 weeks",
    "Internal hosting preferred"
  ],
  non_functional_expectations: {
    expected_user_volume: "400 internal users",
    performance: "Common screens should respond within 3 seconds under normal load",
    availability: "Business hours availability is required",
    auditability: "All approval actions must be traceable",
    access_control: "Role-based access",
    localization: "Thai and English labels preferred"
  },
  delivery_preference: {
    delivery_mode: "mvp_first",
    need_brd: true,
    need_srs: true,
    need_architecture_proposal: true,
    need_estimate_and_roadmap: true
  },
  unknowns: [
    "Whether finance approval is mandatory for all requests",
    "Whether approved requests must create ERP purchase orders in MVP"
  ]
};

const form = document.getElementById("intake-form");
const jsonOutput = document.getElementById("json-output");
const markdownOutput = document.getElementById("markdown-output");
const finalOutput = document.getElementById("final-output");
const aiOutput = document.getElementById("ai-output");
const loadSampleButton = document.getElementById("load-sample");
const copyButton = document.getElementById("copy-output");
const downloadJsonButton = document.getElementById("download-json");
const downloadMarkdownButton = document.getElementById("download-markdown");
const downloadFinalButton = document.getElementById("download-final");
const downloadAiButton = document.getElementById("download-ai");
const validationPanel = document.getElementById("validation-panel");
const validationBadge = document.getElementById("validation-badge");
const saveProjectButton = document.getElementById("save-project");
const loadProjectButton = document.getElementById("load-project");
const exportProjectButton = document.getElementById("export-project");
const importProjectInput = document.getElementById("import-project");
const projectMessage = document.getElementById("project-message");
const apiKeyInput = document.getElementById("openai-api-key");
const modelInput = document.getElementById("openai-model");
const extraInstructionsInput = document.getElementById("ai-extra-instructions");
const generateAiOutputButton = document.getElementById("generate-ai-output");
const aiStatus = document.getElementById("ai-status");
const tabs = document.querySelectorAll(".tab");
const panes = document.querySelectorAll(".output-pane");

const storagePrefix = "requirement-system-project:";
let latestPayload = null;

const requiredFieldNames = [
  "business_context",
  "problem_statement",
  "business_goal"
];

const highValueFieldNames = [
  "users",
  "current_process",
  "must_have_features",
  "constraints",
  "integrations"
];

function splitLines(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeDeliveryMode(value) {
  if (value === "mvp_first" || value === "full_scope_first" || value === "unspecified") {
    return value;
  }

  if (value.includes("MVP") || value.includes("mvp")) {
    return "mvp_first";
  }

  return "unspecified";
}

function getDeliveryModeLabel(value) {
  const labels = {
    mvp_first: "เริ่มจาก MVP ก่อน",
    full_scope_first: "ต้องการเห็นภาพเต็มก่อน",
    unspecified: "ยังไม่ระบุ"
  };

  return labels[value] || value;
}

function parseUsers(value) {
  return splitLines(value).map((line) => {
    const [role, description = ""] = line.split("|").map((part) => part.trim());
    return { role, description };
  });
}

function parseStakeholders(value) {
  return splitLines(value).map((line) => {
    const [name, role = "", influence = "medium"] = line.split("|").map((part) => part.trim());
    return { name, role, influence: influence || "medium" };
  });
}

function parseIntegrations(value) {
  return splitLines(value).map((line) => {
    const [system_name, purpose = "", direction = "unknown"] = line.split("|").map((part) => part.trim());
    return { system_name, purpose, direction: direction || "unknown" };
  });
}

function populateForm(data) {
  form.project_storage_name.value = data.project_storage_name || data.project_name || "";
  form.project_name.value = data.project_name || "";
  form.business_context.value = data.business_context || "";
  form.problem_statement.value = data.problem_statement || "";
  form.business_goal.value = data.business_goal || "";
  form.success_metrics.value = (data.success_metrics || []).join("\n");
  form.users.value = (data.users || []).map((item) => `${item.role} | ${item.description || ""}`).join("\n");
  form.stakeholders.value = (data.stakeholders || []).map((item) => `${item.name} | ${item.role || ""} | ${item.influence || "medium"}`).join("\n");
  form.current_process.value = (data.current_process || []).join("\n");
  form.pain_points.value = (data.pain_points || []).join("\n");
  form.must_have_features.value = (data.must_have_features || []).join("\n");
  form.nice_to_have_features.value = (data.nice_to_have_features || []).join("\n");
  form.reports.value = (data.reports || []).join("\n");
  form.integrations.value = (data.integrations || []).map((item) => `${item.system_name} | ${item.purpose || ""} | ${item.direction || "unknown"}`).join("\n");
  form.constraints.value = (data.constraints || []).join("\n");
  form.expected_user_volume.value = data.non_functional_expectations?.expected_user_volume || "";
  form.performance.value = data.non_functional_expectations?.performance || "";
  form.availability.value = data.non_functional_expectations?.availability || "";
  form.auditability.value = data.non_functional_expectations?.auditability || "";
  form.access_control.value = data.non_functional_expectations?.access_control || "";
  form.localization.value = data.non_functional_expectations?.localization || "";
  form.delivery_mode.value = normalizeDeliveryMode(data.delivery_preference?.delivery_mode || "mvp_first");
  form.need_brd.checked = Boolean(data.delivery_preference?.need_brd);
  form.need_srs.checked = Boolean(data.delivery_preference?.need_srs);
  form.need_architecture_proposal.checked = Boolean(data.delivery_preference?.need_architecture_proposal);
  form.need_estimate_and_roadmap.checked = Boolean(data.delivery_preference?.need_estimate_and_roadmap);
  form.unknowns.value = (data.unknowns || []).join("\n");
}

function serializeForm() {
  return {
    project_storage_name: form.project_storage_name.value.trim(),
    project_name: form.project_name.value.trim(),
    business_context: form.business_context.value.trim(),
    problem_statement: form.problem_statement.value.trim(),
    business_goal: form.business_goal.value.trim(),
    success_metrics: splitLines(form.success_metrics.value),
    users: parseUsers(form.users.value),
    stakeholders: parseStakeholders(form.stakeholders.value),
    current_process: splitLines(form.current_process.value),
    pain_points: splitLines(form.pain_points.value),
    must_have_features: splitLines(form.must_have_features.value),
    nice_to_have_features: splitLines(form.nice_to_have_features.value),
    reports: splitLines(form.reports.value),
    integrations: parseIntegrations(form.integrations.value),
    constraints: splitLines(form.constraints.value),
    non_functional_expectations: {
      expected_user_volume: form.expected_user_volume.value.trim(),
      performance: form.performance.value.trim(),
      availability: form.availability.value.trim(),
      auditability: form.auditability.value.trim(),
      access_control: form.access_control.value.trim(),
      localization: form.localization.value.trim()
    },
    delivery_preference: {
      delivery_mode: form.delivery_mode.value,
      need_brd: form.need_brd.checked,
      need_srs: form.need_srs.checked,
      need_architecture_proposal: form.need_architecture_proposal.checked,
      need_estimate_and_roadmap: form.need_estimate_and_roadmap.checked
    },
    unknowns: splitLines(form.unknowns.value)
  };
}

function getProjectStorageKey(name) {
  return `${storagePrefix}${name}`;
}

function setProjectMessage(message, type = "info") {
  projectMessage.textContent = message;
  projectMessage.style.color = type === "error" ? "var(--bad)" : type === "success" ? "var(--ok)" : "var(--muted)";
}

function setAiStatus(message, type = "info") {
  aiStatus.textContent = message;
  aiStatus.style.color = type === "error" ? "var(--bad)" : type === "success" ? "var(--ok)" : "var(--muted)";
}

function getFieldValueForValidation(fieldName, payload) {
  const value = payload[fieldName];

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return Boolean(value && String(value).trim());
}

function getFieldElement(fieldName) {
  return form.elements.namedItem(fieldName);
}

function setFieldValidity(fieldName, isValid) {
  const field = getFieldElement(fieldName);

  if (!field || !field.classList) {
    return;
  }

  field.classList.toggle("invalid", !isValid);
}

function validatePayload(payload) {
  const issues = [];
  const warnings = [];

  requiredFieldNames.forEach((fieldName) => {
    const valid = getFieldValueForValidation(fieldName, payload);
    setFieldValidity(fieldName, valid);

    if (!valid) {
      issues.push(fieldName);
    }
  });

  highValueFieldNames.forEach((fieldName) => {
    const valid = getFieldValueForValidation(fieldName, payload);
    setFieldValidity(fieldName, valid || issues.includes(fieldName));

    if (!valid) {
      warnings.push(fieldName);
    }
  });

  return { issues, warnings };
}

function getThaiFieldLabel(fieldName) {
  const labels = {
    business_context: "บริบทธุรกิจ",
    problem_statement: "ปัญหาหลักที่ต้องการแก้",
    business_goal: "เป้าหมายทางธุรกิจ",
    users: "กลุ่มผู้ใช้งาน",
    current_process: "กระบวนการทำงานปัจจุบัน",
    must_have_features: "ความสามารถที่จำเป็นต้องมีในระยะแรก",
    constraints: "ข้อจำกัดหรือเงื่อนไขสำคัญ",
    integrations: "ระบบที่ต้องเชื่อมต่อ"
  };

  return labels[fieldName] || fieldName;
}

function renderValidation(payload) {
  const { issues, warnings } = validatePayload(payload);

  if (!issues.length && !warnings.length) {
    validationPanel.classList.add("hidden");
    validationBadge.textContent = "ข้อมูลพร้อมใช้งาน";
    validationBadge.className = "status-chip good";
    return true;
  }

  const issueLines = issues.map((fieldName) => `<li><strong>${getThaiFieldLabel(fieldName)}</strong> เป็นข้อมูลจำเป็นขั้นต่ำ</li>`);
  const warningLines = warnings.map((fieldName) => `<li><strong>${getThaiFieldLabel(fieldName)}</strong> ยังไม่มีข้อมูล อาจทำให้การวิเคราะห์หรือออกแบบคลาดเคลื่อน</li>`);

  validationPanel.innerHTML = [
    "<h3>ข้อเสนอแนะก่อนนำข้อมูลไปวิเคราะห์</h3>",
    issues.length ? `<p>ข้อมูลจำเป็นที่ควรกรอกเพิ่ม:</p><ul>${issueLines.join("")}</ul>` : "",
    warnings.length ? `<p>ข้อมูลที่ควรมีเพื่อให้ผลวิเคราะห์แม่นขึ้น:</p><ul>${warningLines.join("")}</ul>` : ""
  ].join("");
  validationPanel.classList.remove("hidden");

  if (issues.length) {
    validationBadge.textContent = `ข้อมูลยังไม่ครบ ${issues.length} จุด`;
    validationBadge.className = "status-chip bad";
  } else {
    validationBadge.textContent = `ควรเติมข้อมูลเพิ่ม ${warnings.length} จุด`;
    validationBadge.className = "status-chip warn";
  }

  return !issues.length;
}

function formatBulletSection(title, items) {
  const lines = items.length ? items.map((item) => `- ${item}`) : ["- "];
  return `## ${title}\n${lines.join("\n")}`;
}

function toMarkdown(payload) {
  const userLines = payload.users.length
    ? payload.users.map((item) => `- ${item.role}${item.description ? `: ${item.description}` : ""}`)
    : ["- "];
  const stakeholderLines = payload.stakeholders.length
    ? payload.stakeholders.map((item) => `- ${item.name} | ${item.role} | ${item.influence || "medium"}`)
    : ["- "];
  const integrationLines = payload.integrations.length
    ? payload.integrations.map((item) => `- ${item.system_name} | ${item.purpose || ""} | ${item.direction || "unknown"}`)
    : ["- "];

  return [
    "# สรุปข้อมูลตั้งต้นจากลูกค้า",
    "",
    `## ชื่อโครงการ\n- ${payload.project_name || ""}`,
    `## บริบทธุรกิจ\n- ${payload.business_context || ""}`,
    `## ปัญหาหลักที่ต้องการแก้\n- ${payload.problem_statement || ""}`,
    `## เป้าหมายทางธุรกิจ\n- ${payload.business_goal || ""}`,
    formatBulletSection("ตัวชี้วัดความสำเร็จ", payload.success_metrics),
    `## กลุ่มผู้ใช้งาน\n${userLines.join("\n")}`,
    `## ผู้มีส่วนเกี่ยวข้องหลัก\n${stakeholderLines.join("\n")}`,
    formatBulletSection("กระบวนการทำงานปัจจุบัน", payload.current_process),
    formatBulletSection("Pain Points", payload.pain_points),
    formatBulletSection("ความสามารถที่จำเป็นต้องมีในระยะแรก", payload.must_have_features),
    formatBulletSection("ความสามารถที่ควรมีในระยะถัดไป", payload.nice_to_have_features),
    formatBulletSection("รายงานหรือ Dashboard ที่ต้องการ", payload.reports),
    `## ระบบที่ต้องเชื่อมต่อ\n${integrationLines.join("\n")}`,
    formatBulletSection("ข้อจำกัดหรือเงื่อนไขสำคัญ", payload.constraints),
    "## ความคาดหวังด้านคุณภาพระบบ",
    `- จำนวนผู้ใช้งานโดยประมาณ: ${payload.non_functional_expectations.expected_user_volume || ""}`,
    `- ประสิทธิภาพ: ${payload.non_functional_expectations.performance || ""}`,
    `- ความพร้อมใช้งาน: ${payload.non_functional_expectations.availability || ""}`,
    `- การตรวจสอบย้อนหลัง: ${payload.non_functional_expectations.auditability || ""}`,
    `- สิทธิ์การเข้าถึง: ${payload.non_functional_expectations.access_control || ""}`,
    `- ภาษาและการรองรับผู้ใช้: ${payload.non_functional_expectations.localization || ""}`,
    "## รูปแบบงานที่ต้องการส่งมอบ",
    `- แนวทางการส่งมอบ: ${getDeliveryModeLabel(payload.delivery_preference.delivery_mode)}`,
    `- ต้องการ BRD: ${payload.delivery_preference.need_brd}`,
    `- ต้องการ SRS: ${payload.delivery_preference.need_srs}`,
    `- ต้องการ Architecture Proposal: ${payload.delivery_preference.need_architecture_proposal}`,
    `- ต้องการ Estimate และ Roadmap: ${payload.delivery_preference.need_estimate_and_roadmap}`,
    formatBulletSection("เรื่องที่ยังไม่ชัดเจน", payload.unknowns)
  ].join("\n\n");
}

function buildMockFinalOutput(payload) {
  const keyUsers = payload.users.map((item) => item.role).filter(Boolean);
  const readinessMissing = [];

  if (!payload.current_process.length) readinessMissing.push("Current process ยังไม่ครบ");
  if (!payload.integrations.length) readinessMissing.push("Integration requirements ยังไม่ชัด");
  if (!payload.constraints.length) readinessMissing.push("Constraints ยังไม่ครบ");

  const readinessLevel = readinessMissing.length >= 3 ? "low" : readinessMissing.length ? "medium" : "high";
  const optionAName = payload.project_name ? `${payload.project_name} แบบ Web Application` : "Solution Option A";
  const optionBName = payload.project_name ? `${payload.project_name} แบบแยกบริการหลัก` : "Solution Option B";

  return [
    "## Executive Summary",
    `- โครงการนี้มีเป้าหมายเพื่อ ${payload.business_goal || "ยกระดับกระบวนการทำงานหลักขององค์กร"}`,
    `- ปัญหาปัจจุบันคือ ${payload.problem_statement || "ยังไม่ได้ระบุ"}`,
    `- แนวทางที่แนะนำเบื้องต้นคือพัฒนาระบบที่ตอบโจทย์กลุ่มผู้ใช้หลัก ได้แก่ ${keyUsers.join(", ") || "ผู้ใช้หลักของระบบ"}`,
    "",
    "## Business Context",
    `- ${payload.business_context || "ยังไม่ได้ระบุ"}`,
    "",
    "## Problem Statement",
    `- ${payload.problem_statement || "ยังไม่ได้ระบุ"}`,
    "",
    "## Goals And Success Metrics",
    ...(payload.success_metrics.length ? payload.success_metrics.map((item) => `- ${item}`) : ["- ยังไม่ได้ระบุตัวชี้วัดความสำเร็จ"]),
    "",
    "## Stakeholders And User Roles",
    ...(payload.stakeholders.length ? payload.stakeholders.map((item) => `- ${item.name} | ${item.role} | influence: ${item.influence || "medium"}`) : ["- ยังไม่ได้ระบุ stakeholder หลัก"]),
    ...(payload.users.length ? payload.users.map((item) => `- User Role: ${item.role}${item.description ? ` | ${item.description}` : ""}`) : ["- ยังไม่ได้ระบุกลุ่มผู้ใช้หลัก"]),
    "",
    "## สถานะความครบถ้วนของข้อมูล",
    `- ระดับความพร้อม: ${readinessLevel}`,
    ...(readinessMissing.length ? readinessMissing.map((item) => `- ${item}`) : ["- ข้อมูลสำคัญอยู่ในระดับที่พร้อมสำหรับการวิเคราะห์ต่อ"]),
    "",
    "## ความต้องการเชิงฟังก์ชัน",
    ...(payload.must_have_features.length ? payload.must_have_features.map((item, index) => `- FR-${String(index + 1).padStart(3, "0")}: ${item}`) : ["- ยังไม่ได้ระบุความสามารถหลักที่ต้องมี"]),
    "",
    "## ความต้องการเชิงคุณภาพของระบบ",
    `- Performance: ${payload.non_functional_expectations.performance || "ยังไม่ได้ระบุ"}`,
    `- Availability: ${payload.non_functional_expectations.availability || "ยังไม่ได้ระบุ"}`,
    `- Auditability: ${payload.non_functional_expectations.auditability || "ยังไม่ได้ระบุ"}`,
    `- Access Control: ${payload.non_functional_expectations.access_control || "ยังไม่ได้ระบุ"}`,
    `- Localization: ${payload.non_functional_expectations.localization || "ยังไม่ได้ระบุ"}`,
    "",
    "## กฎธุรกิจและข้อจำกัด",
    ...(payload.constraints.length ? payload.constraints.map((item) => `- ${item}`) : ["- ยังไม่มี business rule หรือ constraint ที่ระบุชัด"]),
    "",
    "## สมมติฐาน",
    ...(payload.unknowns.length ? payload.unknowns.map((item) => `- ต้องยืนยันเพิ่มเติม: ${item}`) : ["- สมมติว่า requirement หลักสามารถเริ่มในรูปแบบ MVP ได้"]),
    "",
    "## ประเด็นที่ต้องยืนยันเพิ่มเติม",
    ...(payload.unknowns.length ? payload.unknowns.map((item) => `- ${item}`) : ["- ยังไม่มีคำถามเปิดที่ระบุ"]),
    "",
    "## ทางเลือกของแนวทางแก้ปัญหา",
    `### ทางเลือก A\n- ${optionAName}\n- เหมาะสำหรับการเริ่มต้น MVP เร็ว ลดความซับซ้อนในการดูแล\n- เหมาะเมื่อ integration และ workflow ยังไม่กระจายมาก`,
    `### ทางเลือก B\n- ${optionBName}\n- เหมาะเมื่อองค์กรต้องการแยก workflow, notification หรือ integration เพื่อขยายในอนาคต\n- มีความยืดหยุ่นมากขึ้นแต่ใช้ effort สูงกว่าในระยะเริ่มต้น`,
    "",
    "## แนวทางที่แนะนำ",
    `- แนะนำเริ่มจากทางเลือก A เพื่อให้สอดคล้องกับแนวทาง ${getDeliveryModeLabel(payload.delivery_preference.delivery_mode)} และลดความเสี่ยงในการเริ่มต้น`,
    "",
    "## สรุปภาพรวมสถาปัตยกรรม",
    `- ช่องทางหลัก: ${keyUsers.length ? `web application สำหรับ ${keyUsers.join(", ")}` : "web application ภายในองค์กร"}`,
    `- โมดูลหลัก: ${payload.must_have_features.length ? payload.must_have_features.join(", ") : "request workflow, status tracking, reporting"}`,
    `- Integration: ${payload.integrations.length ? payload.integrations.map((item) => item.system_name).join(", ") : "ยังไม่ระบุ"}`,
    "",
    "## สรุปข้อมูลและการเชื่อมต่อ",
    `- รายงานที่ต้องการ: ${payload.reports.length ? payload.reports.join(", ") : "ยังไม่ระบุ"}`,
    `- ระบบที่ต้องเชื่อมต่อ: ${payload.integrations.length ? payload.integrations.map((item) => `${item.system_name} (${item.direction || "unknown"})`).join(", ") : "ยังไม่ระบุ"}`,
    "",
    "## ความเสี่ยงและสิ่งที่ต้องพึ่งพา",
    ...(readinessMissing.length ? readinessMissing.map((item) => `- ${item}`) : ["- ความเสี่ยงเชิง requirement อยู่ในระดับที่จัดการได้"]),
    "",
    "## ขอบเขต MVP",
    ...(payload.must_have_features.length ? payload.must_have_features.map((item) => `- ${item}`) : ["- ยังไม่ได้ระบุ scope หลักของ MVP"]),
    "",
    "## Roadmap การส่งมอบ",
    "- Phase 1: ยืนยัน requirement และขอบเขต",
    "- Phase 2: ออกแบบและพัฒนา MVP",
    "- Phase 3: UAT, rollout และเก็บ backlog เพื่อปรับปรุง",
    "",
    "## หมายเหตุด้าน Estimate",
    ...(payload.constraints.length ? payload.constraints.map((item) => `- ${item}`) : ["- Estimate จะชัดขึ้นเมื่อ constraint และ integration ยืนยันครบ"]),
    "",
    "## ขั้นตอนถัดไป",
    "1. ยืนยันข้อมูลที่ยังไม่ชัดเจน",
    "2. ตกลงขอบเขต MVP",
    "3. เริ่มวิเคราะห์ requirement เชิงลึกและออกแบบ solution รายละเอียด"
  ].join("\n");
}

function updateOutputs(payload) {
  latestPayload = payload;
  renderValidation(payload);
  jsonOutput.textContent = JSON.stringify(payload, null, 2);
  markdownOutput.textContent = toMarkdown(payload);
  finalOutput.textContent = buildMockFinalOutput(payload);
}

function buildAiPrompt(payload) {
  const systemPrompt = [
    "คุณคือที่ปรึกษาอาวุโสด้าน Business Analysis, Solution Design และ Delivery Planning",
    "ให้วิเคราะห์ข้อมูล requirement ที่ได้รับ โดยห้ามเดาข้อมูลที่ไม่มีหลักฐาน",
    "ต้องแยก facts, assumptions, open questions, risks และ recommendations ให้ชัดเจน",
    "ให้สรุปผลลัพธ์เป็นภาษาไทยเชิงธุรกิจและเทคนิคที่อ่านง่าย ใช้งานต่อได้จริง",
    "ให้จัดรูปแบบผลลัพธ์เป็นหัวข้อดังนี้: Executive Summary, Business Context, Problem Statement, Goals And Success Metrics, Stakeholders And User Roles, Requirement Completeness Status, Functional Requirements, Non-Functional Requirements, Business Rules, Assumptions, Open Questions, Solution Options, Recommended Solution, Architecture Summary, Data And Integration Summary, Risks And Dependencies, MVP Scope, Delivery Roadmap, Estimate Notes, Next Actions"
  ].join("\n");

  const userPrompt = [
    "ต่อไปนี้คือข้อมูลตั้งต้นของลูกค้า:",
    toMarkdown(payload),
    extraInstructionsInput.value.trim() ? `\nคำสั่งเพิ่มเติม:\n${extraInstructionsInput.value.trim()}` : ""
  ].join("\n\n");

  return { systemPrompt, userPrompt };
}

async function generateAiOutput() {
  const payload = latestPayload || serializeForm();
  const apiKey = apiKeyInput.value.trim();
  const model = modelInput.value.trim();

  if (!apiKey) {
    setAiStatus("กรุณาใส่ OpenAI API Key ก่อน", "error");
    return;
  }

  if (!model) {
    setAiStatus("กรุณาระบุชื่อโมเดล", "error");
    return;
  }

  const { systemPrompt, userPrompt } = buildAiPrompt(payload);
  setAiStatus("กำลังสร้าง AI Final Output...", "info");
  generateAiOutputButton.disabled = true;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: systemPrompt }]
          },
          {
            role: "user",
            content: [{ type: "input_text", text: userPrompt }]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }

    const result = await response.json();
    const outputText = result.output_text || "ไม่พบ output_text จาก API";
    aiOutput.textContent = outputText;
    setAiStatus("สร้าง AI Final Output สำเร็จ", "success");
  } catch (error) {
    aiOutput.textContent = "";
    setAiStatus(`เกิดข้อผิดพลาด: ${error.message}`, "error");
  } finally {
    generateAiOutputButton.disabled = false;
  }
}

function downloadText(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  updateOutputs(serializeForm());
});

loadSampleButton.addEventListener("click", () => {
  populateForm(sampleData);
  updateOutputs(sampleData);
  setProjectMessage("โหลดข้อมูลตัวอย่างเรียบร้อย", "success");
});

copyButton.addEventListener("click", async () => {
  const activePane = document.querySelector(".output-pane.active");
  const text = activePane ? activePane.textContent : "";

  if (!text) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    copyButton.textContent = "คัดลอกแล้ว";
    setTimeout(() => {
      copyButton.textContent = "คัดลอกผลลัพธ์ปัจจุบัน";
    }, 1200);
  } catch {
    copyButton.textContent = "คัดลอกไม่สำเร็จ";
    setTimeout(() => {
      copyButton.textContent = "คัดลอกผลลัพธ์ปัจจุบัน";
    }, 1200);
  }
});

downloadJsonButton.addEventListener("click", () => {
  downloadText("requirement-intake.json", jsonOutput.textContent, "application/json;charset=utf-8");
});

downloadMarkdownButton.addEventListener("click", () => {
  downloadText("requirement-brief.md", markdownOutput.textContent, "text/markdown;charset=utf-8");
});

downloadFinalButton.addEventListener("click", () => {
  downloadText("requirement-final-mock.md", finalOutput.textContent, "text/markdown;charset=utf-8");
});

downloadAiButton.addEventListener("click", () => {
  downloadText("requirement-ai-output.md", aiOutput.textContent, "text/markdown;charset=utf-8");
});

saveProjectButton.addEventListener("click", () => {
  const payload = serializeForm();
  const storageName = payload.project_storage_name || payload.project_name;

  if (!storageName) {
    setProjectMessage("กรุณาระบุชื่อไฟล์หรือชื่อโปรเจกต์สำหรับบันทึก", "error");
    return;
  }

  localStorage.setItem(getProjectStorageKey(storageName), JSON.stringify(payload));
  setProjectMessage(`บันทึกโครงการ '${storageName}' ลงในเครื่องนี้แล้ว`, "success");
  updateOutputs(payload);
});

loadProjectButton.addEventListener("click", () => {
  const storageName = form.project_storage_name.value.trim() || form.project_name.value.trim();

  if (!storageName) {
    setProjectMessage("กรุณาระบุชื่อโปรเจกต์ที่ต้องการโหลด", "error");
    return;
  }

  const raw = localStorage.getItem(getProjectStorageKey(storageName));

  if (!raw) {
    setProjectMessage(`ไม่พบข้อมูลของโครงการ '${storageName}' ในเครื่องนี้`, "error");
    return;
  }

  const data = JSON.parse(raw);
  populateForm(data);
  updateOutputs(data);
  setProjectMessage(`โหลดโครงการ '${storageName}' สำเร็จ`, "success");
});

exportProjectButton.addEventListener("click", () => {
  const payload = serializeForm();
  const filenameBase = payload.project_storage_name || payload.project_name || "requirement-project";
  downloadText(`${filenameBase}.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
  setProjectMessage("ส่งออกไฟล์โครงการเรียบร้อย", "success");
});

importProjectInput.addEventListener("change", async (event) => {
  const file = event.target.files && event.target.files[0];

  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    populateForm(data);
    updateOutputs(data);
    setProjectMessage(`นำเข้าไฟล์ '${file.name}' สำเร็จ`, "success");
  } catch (error) {
    setProjectMessage(`นำเข้าไฟล์ไม่สำเร็จ: ${error.message}`, "error");
  } finally {
    importProjectInput.value = "";
  }
});

generateAiOutputButton.addEventListener("click", () => {
  updateOutputs(serializeForm());
  generateAiOutput();
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.remove("active"));
    panes.forEach((pane) => pane.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`${tab.dataset.tab}-output`).classList.add("active");
  });
});

form.addEventListener("reset", () => {
  setTimeout(() => {
    updateOutputs(serializeForm());
    setProjectMessage("ล้างข้อมูลในฟอร์มแล้ว", "info");
    setAiStatus("", "info");
    aiOutput.textContent = "";
  }, 0);
});

form.addEventListener("input", () => {
  renderValidation(serializeForm());
});

populateForm(sampleData);
updateOutputs(sampleData);
