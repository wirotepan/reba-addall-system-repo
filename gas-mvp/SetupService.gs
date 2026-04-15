// ============================================================
// SetupService.gs — One-time sheet initialisation
// Run: Tools → Run function → runSetup (from Code.gs)
// ============================================================

const SetupService = (() => {

  const SHEET_DEFS = {
    [CONFIG.SHEETS.USERS]: [
      'id','email','name','role',
      'createdAt','updatedAt','deleted','deletedAt',
    ],
    [CONFIG.SHEETS.ASSESSMENTS]: [
      'id','parentId','jobTask','department','workerName',
      'assessmentDate','assessorEmail','assessorName',
      'neck','neckMod','trunk','trunkMod','legs','legsMod',
      'loadScore','loadShock',
      'upperArm','upperArmMod','lowerArm','wrist','wristMod','couplingScore',
      'activityScore',
      'scoreA','scoreB','scoreC','finalScore','riskLevel',
      'notes','imageUrls','status','createdAt','updatedAt','deleted','deletedAt',
    ],
    [CONFIG.SHEETS.ACTION_PLANS]: [
      'id','assessmentId','controlType','description',
      'responsiblePerson','dueDate','status','notes',
      'createdAt','createdBy','updatedAt','updatedBy',
      'completedAt','deleted','deletedAt',
    ],
    [CONFIG.SHEETS.AUDIT_LOG]: [
      'id','timestamp','userEmail','action',
      'entityType','entityId','details',
    ],
  };

  function initAll() {
    const ss = CONFIG.SPREADSHEET_ID
      ? SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
      : SpreadsheetApp.getActiveSpreadsheet();

    Object.entries(SHEET_DEFS).forEach(([name, headers]) => {
      _createOrVerifySheet(ss, name, headers);
    });

    // Make current user admin
    _ensureAdminUser(ss);

    Logger.log('✅ REBA Setup complete. Spreadsheet: ' + ss.getUrl());
    SpreadsheetApp.getUi().alert('Setup เสร็จสมบูรณ์!\n\nระบบพร้อมใช้งานแล้ว');
  }

  function _createOrVerifySheet(ss, name, headers) {
    let sheet = ss.getSheetByName(name);

    if (!sheet) {
      sheet = ss.insertSheet(name);
      Logger.log('Created sheet: ' + name);
    }

    // Only set header if row 1 is empty
    const existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    const isEmpty  = existing.every(v => v === '' || v === null);
    if (isEmpty) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      // Style header row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#1a73e8')
                 .setFontColor('#ffffff')
                 .setFontWeight('bold')
                 .setHorizontalAlignment('center');
      sheet.setFrozenRows(1);
      Logger.log('Headers set for: ' + name);
    }

    // Auto-resize columns for readability
    sheet.autoResizeColumns(1, headers.length);
  }

  function _ensureAdminUser(ss) {
    const email = Session.getActiveUser().getEmail();
    if (!email) return;

    const sheet  = ss.getSheetByName(CONFIG.SHEETS.USERS);
    const data   = sheet.getDataRange().getValues();
    const headers = data[0];
    const emailIdx = headers.indexOf('email');
    const exists = data.slice(1).some(r => r[emailIdx] === email);

    if (!exists) {
      const now = new Date().toISOString();
      const row = headers.map(h => ({
        id:        _newId(),
        email,
        name:      email.split('@')[0],
        role:      CONFIG.ROLES.ADMIN,
        createdAt: now,
        updatedAt: now,
        deleted:   false,
        deletedAt: '',
      }[h] || ''));
      sheet.appendRow(row);
      Logger.log('Admin user created: ' + email);
    }
  }

  function _newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  return { initAll };

})();
