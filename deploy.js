#!/usr/bin/env node
// ============================================================
// deploy.js — Multi-client REBA GAS Deployment Manager
// Usage:  node deploy.js
//    or:  deploy.bat  (Windows)
// ============================================================

const fs       = require('fs');
const path     = require('path');
const { execSync, spawnSync } = require('child_process');
const readline = require('readline');

const ROOT        = __dirname;
const CLIENTS_DIR = path.join(ROOT, 'clients');
const CLASP_JSON  = path.join(ROOT, '.clasp.json');
const GAS_DIR     = path.join(ROOT, 'gas-mvp');

// ── ANSI colors ───────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  cyan:   '\x1b[36m',
  red:    '\x1b[31m',
  gray:   '\x1b[90m',
};
const ok  = (s) => console.log(C.green  + '✅ ' + s + C.reset);
const err = (s) => console.log(C.red    + '❌ ' + s + C.reset);
const inf = (s) => console.log(C.cyan   + 'ℹ  ' + s + C.reset);
const hdr = (s) => console.log('\n' + C.bold + C.blue + s + C.reset);
const hr  = ()  => console.log(C.gray + '─'.repeat(52) + C.reset);

// ── Readline helper ───────────────────────────────────────
function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

function askChoice(prompt, choices) {
  return new Promise(async (resolve) => {
    while (true) {
      const ans = await ask(prompt);
      const n   = parseInt(ans);
      if (n >= 1 && n <= choices.length) { resolve(n - 1); return; }
      console.log(C.yellow + '  กรุณาใส่หมายเลข 1–' + choices.length + C.reset);
    }
  });
}

// ── Client config helpers ─────────────────────────────────
function loadClients() {
  if (!fs.existsSync(CLIENTS_DIR)) fs.mkdirSync(CLIENTS_DIR, { recursive: true });
  return fs.readdirSync(CLIENTS_DIR)
    .filter(f => f.endsWith('.json') && f !== 'template.json')
    .map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(CLIENTS_DIR, f), 'utf8')); }
      catch (_) { return null; }
    })
    .filter(Boolean);
}

function saveClient(client) {
  const slug = client.name
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);
  const file = path.join(CLIENTS_DIR, slug + '.json');
  fs.writeFileSync(file, JSON.stringify(client, null, 2), 'utf8');
  return file;
}

// ── clasp helpers ─────────────────────────────────────────
function checkClaspLogin() {
  const clasprc = path.join(require('os').homedir(), '.clasprc.json');
  return fs.existsSync(clasprc);
}

function writeClasp(scriptId) {
  fs.writeFileSync(CLASP_JSON, JSON.stringify({
    scriptId,
    rootDir: './gas-mvp',
  }, null, 2));
}

function runClasp(args, label) {
  inf('กำลัง ' + label + '...');
  const result = spawnSync('clasp', args, {
    cwd:   ROOT,
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) throw new Error('clasp ' + args[0] + ' ล้มเหลว');
}

// ── Main flows ────────────────────────────────────────────

async function flowLogin() {
  hdr('🔐 Login Google Account');
  inf('Browser จะเปิดขึ้นมา — กรุณา Login และ Allow access');
  runClasp(['login'], 'login');
  ok('Login สำเร็จ');
}

async function flowNewClient() {
  hdr('➕ เพิ่มลูกค้าใหม่');
  hr();

  const name          = await ask('  ชื่อบริษัท/ลูกค้า: ');
  const scriptId      = await ask('  Script ID (จาก GAS → ⚙️ Project Settings): ');
  const spreadsheetId = await ask('  Spreadsheet ID (จาก Google Sheets URL): ');
  const contact       = await ask('  ผู้ติดต่อ (ไม่บังคับ): ');

  if (!name || !scriptId) {
    err('ชื่อและ Script ID จำเป็นต้องใส่'); return null;
  }

  const client = {
    name,
    scriptId:      scriptId.trim(),
    spreadsheetId: spreadsheetId.trim(),
    contact:       contact || '',
    createdAt:     new Date().toISOString().split('T')[0],
    lastDeployed:  '',
  };

  const file = saveClient(client);
  ok('บันทึก client แล้ว: ' + path.relative(ROOT, file));
  return client;
}

async function flowDeploy(client, opts = {}) {
  hdr('🚀 Deploy → ' + client.name);
  hr();
  inf('Script ID:      ' + client.scriptId);
  inf('Spreadsheet ID: ' + (client.spreadsheetId || '(ยังไม่ตั้งค่า)'));
  console.log();

  // Write .clasp.json for this client
  writeClasp(client.scriptId);
  inf('.clasp.json → scriptId: ' + client.scriptId);

  // Push code
  runClasp(['push', '--force'], 'clasp push');
  ok('Push code สำเร็จ');

  // Deploy new version
  if (opts.deploy !== false) {
    const desc = 'v' + new Date().toISOString().replace('T',' ').slice(0,16);
    runClasp(['deploy', '--description', desc], 'clasp deploy');
    ok('Deploy version: ' + desc);
  }

  // Update lastDeployed in client file
  client.lastDeployed = new Date().toISOString().split('T')[0];
  saveClient(client);

  hr();
  ok('Deploy สำเร็จ: ' + client.name);

  if (client.spreadsheetId) {
    inf('ขั้นตอนต่อไป: เปิด Apps Script editor แล้วรัน runSetup()');
    inf('GAS: https://script.google.com/d/' + client.scriptId + '/edit');
  } else {
    console.log(C.yellow + '  ⚠️  ยังไม่มี Spreadsheet ID — อย่าลืมอัปเดตใน clients/*.json' + C.reset);
  }
}

async function flowDeployAll(clients) {
  hdr('🚀 Deploy ทุกลูกค้า (' + clients.length + ' บริษัท)');
  const results = [];
  for (const c of clients) {
    try {
      await flowDeploy(c, { deploy: true });
      results.push({ name: c.name, ok: true });
    } catch (e) {
      err('Deploy ล้มเหลว: ' + c.name + ' — ' + e.message);
      results.push({ name: c.name, ok: false, error: e.message });
    }
  }
  hdr('📊 สรุปผล');
  results.forEach(r => {
    if (r.ok) ok(r.name);
    else      err(r.name + ' (' + r.error + ')');
  });
}

async function flowStatus(clients) {
  hdr('📋 รายชื่อลูกค้าทั้งหมด');
  hr();
  if (!clients.length) {
    inf('ยังไม่มีลูกค้า — เลือก "เพิ่มลูกค้าใหม่" ก่อน');
    return;
  }
  clients.forEach((c, i) => {
    const deployed = c.lastDeployed ? C.green + '✓ ' + c.lastDeployed + C.reset : C.yellow + '(ยังไม่ deploy)' + C.reset;
    console.log(`  ${String(i+1).padStart(2)}. ${C.bold}${c.name}${C.reset} ${deployed}`);
    console.log(C.gray + '       Script ID: ' + c.scriptId + C.reset);
  });
  hr();
}

// ── Main menu ─────────────────────────────────────────────

async function main() {
  console.clear();
  console.log(C.bold + C.blue);
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   REBA Assessment — Multi-Client Deploy Tool    ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(C.reset);

  // Check clasp login
  if (!checkClaspLogin()) {
    console.log(C.yellow + '⚠️  ยังไม่ได้ login clasp' + C.reset);
    const doLogin = await ask('  Login ตอนนี้เลย? (y/n): ');
    if (doLogin.toLowerCase() === 'y') await flowLogin();
    else { inf('กรุณารัน: clasp login แล้วลองใหม่'); process.exit(0); }
  }

  while (true) {
    const clients = loadClients();
    await flowStatus(clients);

    console.log('  เลือกดำเนินการ:');
    console.log('  1. Deploy ลูกค้าที่เลือก');
    console.log('  2. Deploy ทุกลูกค้า');
    console.log('  3. เพิ่มลูกค้าใหม่');
    console.log('  4. เพิ่มลูกค้าใหม่ + Deploy ทันที');
    console.log('  5. ออก');
    console.log();

    const choice = await ask('  เลือก (1-5): ');

    if (choice === '1') {
      if (!clients.length) { err('ยังไม่มีลูกค้า'); continue; }
      clients.forEach((c, i) => console.log(`  ${i+1}. ${c.name}`));
      const idx = await askChoice('  เลือกลูกค้า: ', clients);
      await flowDeploy(clients[idx]);
    }
    else if (choice === '2') {
      if (!clients.length) { err('ยังไม่มีลูกค้า'); continue; }
      await flowDeployAll(clients);
    }
    else if (choice === '3') {
      await flowNewClient();
    }
    else if (choice === '4') {
      const client = await flowNewClient();
      if (client) await flowDeploy(client);
    }
    else if (choice === '5') {
      inf('ออกจากโปรแกรม');
      process.exit(0);
    }

    await ask('\n  กด Enter เพื่อกลับเมนู...');
    console.clear();
  }
}

main().catch(e => { err(e.message); process.exit(1); });
