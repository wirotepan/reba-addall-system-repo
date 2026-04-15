// ============================================================
// Config.gs — Central configuration & constants
// ============================================================

const CONFIG = {
  SPREADSHEET_ID: '',   // ← วาง Spreadsheet ID ที่นี่หลัง Setup

  SHEETS: {
    USERS:       'Users',
    ASSESSMENTS: 'Assessments',
    ACTION_PLANS: 'ActionPlans',
    AUDIT_LOG:   'AuditLog',
  },

  ROLES: {
    ADMIN:           'admin',
    SAFETY_OFFICER:  'safety_officer',
    SUPERVISOR:      'supervisor',
    EXECUTIVE:       'executive',
  },

  CACHE_TTL: 300,   // seconds — CacheService TTL (5 min)

  RISK: {
    negligible: { label: 'ไม่มีความเสี่ยง',     color: '#28a745', action: 'ไม่จำเป็นต้องดำเนินการ',               badge: 'success' },
    low:        { label: 'ความเสี่ยงต่ำ',        color: '#8bc34a', action: 'อาจต้องเปลี่ยนแปลง',                  badge: 'info'    },
    medium:     { label: 'ความเสี่ยงปานกลาง',   color: '#ffc107', action: 'ต้องสืบสวนและดำเนินการเร็วๆ นี้',     badge: 'warning' },
    high:       { label: 'ความเสี่ยงสูง',        color: '#fd7e14', action: 'ต้องสืบสวนและดำเนินการแก้ไข',        badge: 'orange'  },
    very_high:  { label: 'ความเสี่ยงสูงมาก',    color: '#dc3545', action: 'ต้องดำเนินการแก้ไขทันที',             badge: 'danger'  },
  },

  // Hierarchy of Controls recommendations per risk level
  RECOMMENDATIONS: {
    negligible: [
      { type: 'admin', text: 'ตรวจสอบท่าทางการทำงานตามปกติต่อไป' },
    ],
    low: [
      { type: 'admin',     text: 'ควรพิจารณาปรับปรุงท่าทางการทำงานหรือลำดับงาน' },
      { type: 'ppe',       text: 'ตรวจสอบความเหมาะสมของอุปกรณ์ป้องกันส่วนบุคคล' },
    ],
    medium: [
      { type: 'engineering', text: 'ปรับปรุงสภาพแวดล้อมการทำงาน เช่น ความสูงโต๊ะ เก้าอี้ หรือตำแหน่งอุปกรณ์' },
      { type: 'admin',       text: 'จัดตารางพัก สลับงาน หรืออบรมท่าทางการทำงานที่ถูกต้อง' },
      { type: 'ppe',         text: 'จัดหาอุปกรณ์สนับสนุน เช่น สายรัดข้อมือ หรือรองรับหลัง' },
    ],
    high: [
      { type: 'substitution',  text: 'พิจารณาเปลี่ยนวิธีการทำงานหรืออุปกรณ์ที่ใช้ให้ลดภาระงาน' },
      { type: 'engineering',   text: 'ติดตั้งอุปกรณ์ช่วย เช่น ลิฟต์ รางเลื่อน หรือโต๊ะปรับระดับ' },
      { type: 'admin',         text: 'จำกัดเวลาการทำงานในท่าทางที่เสี่ยง พร้อมกำหนดการพักสม่ำเสมอ' },
    ],
    very_high: [
      { type: 'elimination',   text: 'ขจัดงานที่เสี่ยงออก หรือนำระบบอัตโนมัติ/หุ่นยนต์มาใช้แทนทันที' },
      { type: 'substitution',  text: 'เปลี่ยนกระบวนการทำงานใหม่ทั้งหมดเพื่อลดความเสี่ยงทางกายภาพ' },
      { type: 'engineering',   text: 'ออกแบบสถานีงานใหม่โดยใช้หลัก Ergonomics ก่อนกลับมาทำงาน' },
    ],
  },

  CONTROL_TYPE_LABEL: {
    elimination:   '1. Elimination — ขจัดอันตราย',
    substitution:  '2. Substitution — ทดแทน',
    engineering:   '3. Engineering Controls — วิศวกรรม',
    admin:         '4. Administrative Controls — บริหารจัดการ',
    ppe:           '5. PPE — อุปกรณ์ป้องกันส่วนบุคคล',
  },
};

function getConfig() { return CONFIG; }
