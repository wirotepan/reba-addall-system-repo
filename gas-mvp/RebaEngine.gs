// ============================================================
// RebaEngine.gs — Pure REBA calculation engine
// Lookup tables hardcoded (no Sheet reads) for max performance.
// Reference: Hignett & McAtamney (2000)
// ============================================================

const RebaEngine = (() => {

  // ── Table A: [trunk-1][neck-1][legs-1] ────────────────────
  // trunk 1-5, neck 1-3, legs 1-4
  const TABLE_A = [
    // trunk = 1
    [[1,2,3,4],[1,2,3,4],[3,3,5,6]],
    // trunk = 2
    [[2,3,4,5],[3,4,5,6],[4,5,6,7]],
    // trunk = 3
    [[2,4,5,6],[4,5,6,7],[5,6,7,8]],
    // trunk = 4
    [[3,5,6,7],[5,6,7,8],[6,7,8,9]],
    // trunk = 5
    [[4,6,7,8],[6,7,8,9],[7,8,9,9]],
  ];

  // ── Table B: [upperArm-1][lowerArm-1][wrist-1] ───────────
  // upper arm 1-6, lower arm 1-2, wrist 1-3
  const TABLE_B = [
    [[1,2,2],[1,2,3]],  // upper arm = 1
    [[1,2,3],[2,3,4]],  // upper arm = 2
    [[3,4,5],[4,5,5]],  // upper arm = 3
    [[4,5,5],[5,6,7]],  // upper arm = 4
    [[6,7,8],[7,8,8]],  // upper arm = 5
    [[7,8,9],[8,9,9]],  // upper arm = 6
  ];

  // ── Table C: [scoreA-1][scoreB-1]  (12×12) ───────────────
  const TABLE_C = [
    [ 1, 1, 1, 2, 3, 3, 4, 5, 6, 7, 7, 7],  // A=1
    [ 1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 7, 8],  // A=2
    [ 2, 3, 3, 3, 4, 5, 6, 7, 7, 8, 8, 8],  // A=3
    [ 3, 4, 4, 4, 5, 6, 7, 8, 8, 9, 9, 9],  // A=4
    [ 4, 4, 4, 5, 6, 7, 8, 8, 9, 9, 9, 9],  // A=5
    [ 6, 6, 6, 7, 8, 8, 9, 9,10,10,10,10],  // A=6
    [ 7, 7, 7, 8, 9, 9, 9,10,10,11,11,11],  // A=7
    [ 8, 8, 8, 9,10,10,10,10,10,11,11,11],  // A=8
    [ 9, 9, 9,10,10,10,11,11,11,12,12,12],  // A=9
    [10,10,10,11,11,11,11,12,12,12,12,12],  // A=10
    [11,11,11,11,12,12,12,12,12,12,12,12],  // A=11
    [12,12,12,12,12,12,12,12,12,12,12,12],  // A=12
  ];

  // ── Posture option definitions (used by UI + engine) ──────

  const POSTURES = {
    neck: [
      { value: 1, label: '0–20° ก้มหน้า' },
      { value: 2, label: '>20° ก้มหน้า หรือแอ่นหลัง' },
      { value: 3, label: 'เงยหน้ามาก (extension)' },
    ],
    neckMod: [
      { value: 0, label: 'ปกติ' },
      { value: 1, label: 'บิดหรือเอียงข้าง (+1)' },
    ],
    trunk: [
      { value: 1, label: 'ตั้งตรง (upright)' },
      { value: 2, label: '0–20° ก้มหรือแอ่น' },
      { value: 3, label: '20–60° ก้ม หรือ >20° แอ่น' },
      { value: 4, label: '>60° ก้มตัว' },
      { value: 5, label: 'ก้มมากพร้อมบิดข้าง' },
    ],
    trunkMod: [
      { value: 0, label: 'ปกติ' },
      { value: 1, label: 'บิดหรือเอียงข้าง (+1)' },
    ],
    legs: [
      { value: 1, label: 'ยืนสองขา / เดิน / นั่งสมดุล' },
      { value: 2, label: 'ยืนขาเดียว / ไม่มั่นคง' },
    ],
    legsMod: [
      { value: 0, label: 'เข่าตรง หรืองอ <30°' },
      { value: 1, label: 'เข่างอ 30–60° (+1)' },
      { value: 2, label: 'เข่างอ >60° (+2)' },
    ],
    load: [
      { value: 0, label: '< 5 กก.' },
      { value: 1, label: '5–10 กก.' },
      { value: 2, label: '> 10 กก.' },
    ],
    loadShock: [
      { value: 0, label: 'ปกติ' },
      { value: 1, label: 'กระแทกหรือกระชาก (+1)' },
    ],
    upperArm: [
      { value: 1, label: 'แขนอยู่ข้างลำตัว (20° ext – 20° flex)' },
      { value: 2, label: '>20° แอ่น หรือ 20–45° ยกขึ้นหน้า' },
      { value: 3, label: '45–90° ยกขึ้นหน้า' },
      { value: 4, label: '>90° ยกขึ้น' },
    ],
    upperArmMod: [
      { value: 0, label: 'ปกติ' },
      { value: 1, label: 'กาง/หมุน หรือไหล่ยก (+1)' },
      { value: -1, label: 'แขนพิงหรือแรงโน้มถ่วงช่วย (-1)' },
    ],
    lowerArm: [
      { value: 1, label: '60–100° งอข้อศอก' },
      { value: 2, label: '<60° หรือ >100°' },
    ],
    wrist: [
      { value: 1, label: '0–15° งอหรือแอ่น' },
      { value: 2, label: '>15° งอหรือแอ่น' },
    ],
    wristMod: [
      { value: 0, label: 'ปกติ' },
      { value: 1, label: 'บิดหรือเบี่ยงข้าง (+1)' },
    ],
    coupling: [
      { value: 0, label: 'ดี — ด้ามจับพอดีมือ' },
      { value: 1, label: 'พอใช้ — รับได้แต่ไม่เหมาะ' },
      { value: 2, label: 'แย่ — จับได้แต่ไม่เหมาะสม' },
      { value: 3, label: 'ยอมรับไม่ได้ — ไม่มีด้ามจับ / ท่าแย่' },
    ],
    activity: [
      { value: 0, label: 'ไม่มีปัจจัยเพิ่มเติม' },
      { value: 1, label: 'ส่วนของร่างกายนิ่งนาน >1 นาที (+1)' },
      { value: 2, label: 'ซ้ำๆ >4 ครั้ง/นาที (+1 ต่อปัจจัย)' },
      { value: 3, label: 'เปลี่ยนท่าเร็ว / ฐานไม่มั่นคง (+1 ต่อปัจจัย)' },
    ],
  };

  // ── Core calculation ───────────────────────────────────────

  /**
   * Calculate REBA score from raw input.
   *
   * @param {object} input
   *   Group A:  neck(1-3), neckMod(0-1), trunk(1-5), trunkMod(0-1),
   *             legs(1-2), legsMod(0-2), loadScore(0-2), loadShock(0-1)
   *   Group B:  upperArm(1-4), upperArmMod(-1 to +1), lowerArm(1-2),
   *             wrist(1-2), wristMod(0-1), couplingScore(0-3)
   *   Activity: activityScore(0-3)
   * @returns {object} full breakdown + finalScore + riskLevel
   */
  function calculate(input) {
    // ── Group A ──
    const neck     = clamp(input.neck + (input.neckMod  || 0), 1, 3);
    const trunk    = clamp(input.trunk + (input.trunkMod || 0), 1, 5);
    const legs     = clamp(input.legs  + (input.legsMod  || 0), 1, 4);
    const rawA     = TABLE_A[trunk-1][neck-1][legs-1];
    const scoreA   = clamp(rawA + (input.loadScore || 0) + (input.loadShock || 0), 1, 12);

    // ── Group B ──
    const upperArm = clamp(input.upperArm + (input.upperArmMod || 0), 1, 6);
    const lowerArm = clamp(input.lowerArm, 1, 2);
    const wrist    = clamp(input.wrist + (input.wristMod || 0), 1, 3);
    const rawB     = TABLE_B[upperArm-1][lowerArm-1][wrist-1];
    const scoreB   = clamp(rawB + (input.couplingScore || 0), 1, 12);

    // ── Table C → Final ──
    const scoreC      = TABLE_C[scoreA-1][scoreB-1];
    const finalScore  = clamp(scoreC + (input.activityScore || 0), 1, 15);
    const riskLevel   = getRiskLevel(finalScore);

    return {
      // intermediates
      neck, trunk, legs, scoreA,
      upperArm, lowerArm, wrist, scoreB,
      scoreC,
      // result
      finalScore,
      riskLevel,
      riskLabel:  CONFIG.RISK[riskLevel].label,
      riskAction: CONFIG.RISK[riskLevel].action,
      riskColor:  CONFIG.RISK[riskLevel].color,
      recommendations: CONFIG.RECOMMENDATIONS[riskLevel],
    };
  }

  function getRiskLevel(score) {
    if (score <= 1)  return 'negligible';
    if (score <= 3)  return 'low';
    if (score <= 7)  return 'medium';
    if (score <= 10) return 'high';
    return 'very_high';
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function getPostures() { return POSTURES; }

  return { calculate, getRiskLevel, getPostures };

})();

// ── Exposed to client ──────────────────────────────────────────
function serverCalculateReba(input) {
  return RebaEngine.calculate(input);
}
function serverGetPostures() {
  return RebaEngine.getPostures();
}
