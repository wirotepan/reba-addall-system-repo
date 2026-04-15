// ============================================================
// Db.gs — Google Sheets helpers with CacheService
// Performance strategy:
//   • Read entire sheet at once (getValues) — 1 API call
//   • Cache results in CacheService (TTL = CONFIG.CACHE_TTL)
//   • Writes flush cache for the affected sheet
// ============================================================

const Db = (() => {

  // ── Private helpers ────────────────────────────────────────

  function _ss() {
    const id = CONFIG.SPREADSHEET_ID;
    return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  }

  function _sheet(name) {
    const s = _ss().getSheetByName(name);
    if (!s) throw new Error('Sheet not found: ' + name);
    return s;
  }

  function _cacheKey(sheetName) { return 'db_' + sheetName; }

  function _clearCache(sheetName) {
    CacheService.getScriptCache().remove(_cacheKey(sheetName));
  }

  /**
   * Read all rows from a sheet.
   * Returns array of plain objects keyed by header row.
   * Result is cached until TTL or next write.
   */
  function readAll(sheetName) {
    const cache = CacheService.getScriptCache();
    const key   = _cacheKey(sheetName);
    const hit   = cache.get(key);
    if (hit) return JSON.parse(hit);

    const sheet  = _sheet(sheetName);
    const values = sheet.getDataRange().getValues();
    if (values.length < 2) {
      cache.put(key, '[]', CONFIG.CACHE_TTL);
      return [];
    }

    const headers = values[0];
    const rows    = values.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });

    cache.put(key, JSON.stringify(rows), CONFIG.CACHE_TTL);
    return rows;
  }

  /**
   * Find rows matching a filter object (shallow equality).
   * e.g. findWhere('Assessments', { status: 'submitted' })
   */
  function findWhere(sheetName, filter) {
    const rows = readAll(sheetName);
    return rows.filter(row =>
      Object.keys(filter).every(k => String(row[k]) === String(filter[k]))
    );
  }

  /** Find single row by id column */
  function findById(sheetName, id) {
    const rows = readAll(sheetName);
    return rows.find(r => String(r.id) === String(id)) || null;
  }

  /**
   * Append a new row. Expects an object with keys matching sheet headers.
   * Returns the saved object (with id if new).
   */
  function insert(sheetName, obj) {
    const sheet   = _sheet(sheetName);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row     = headers.map(h => (obj[h] !== undefined ? obj[h] : ''));
    sheet.appendRow(row);
    _clearCache(sheetName);
    _writeAuditLog('INSERT', sheetName, obj.id || '', obj);
    return obj;
  }

  /**
   * Update an existing row matched by id column.
   * Only updates provided keys (partial update).
   */
  function update(sheetName, id, changes) {
    const sheet   = _sheet(sheetName);
    const data    = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx   = headers.indexOf('id');
    if (idIdx === -1) throw new Error('No id column in ' + sheetName);

    const rowIdx = data.findIndex((r, i) => i > 0 && String(r[idIdx]) === String(id));
    if (rowIdx === -1) throw new Error('Row not found: ' + id);

    Object.keys(changes).forEach(key => {
      const colIdx = headers.indexOf(key);
      if (colIdx !== -1) {
        sheet.getRange(rowIdx + 1, colIdx + 1).setValue(changes[key]);
      }
    });

    _clearCache(sheetName);
    _writeAuditLog('UPDATE', sheetName, id, changes);
    return { id, ...changes };
  }

  /**
   * Soft-delete: sets deleted=true and deletedAt timestamp.
   * Hard delete not used — preserves audit trail.
   */
  function softDelete(sheetName, id) {
    return update(sheetName, id, {
      deleted:   true,
      deletedAt: new Date().toISOString(),
    });
  }

  /** Generate a short unique ID: timestamp base36 + 4 random chars */
  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function now() { return new Date().toISOString(); }

  // ── Audit log ──────────────────────────────────────────────

  function _writeAuditLog(action, entityType, entityId, details) {
    try {
      const sheet = _ss().getSheetByName(CONFIG.SHEETS.AUDIT_LOG);
      if (!sheet) return;
      const user = Session.getActiveUser().getEmail();
      sheet.appendRow([
        newId(),
        now(),
        user,
        action,
        entityType,
        String(entityId),
        JSON.stringify(details),
      ]);
    } catch (_) { /* non-critical */ }
  }

  // ── Public API ─────────────────────────────────────────────
  return { readAll, findWhere, findById, insert, update, softDelete, newId, now };

})();
