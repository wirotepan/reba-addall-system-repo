// ============================================================
// AssessmentService.gs — Assessment CRUD + re-assessment
// ============================================================

const AssessmentService = (() => {

  const SHEET = CONFIG.SHEETS.ASSESSMENTS;

  // ── Schema columns (must match SetupService header order) ──
  const COLS = [
    'id','parentId','jobTask','department','workerName',
    'assessmentDate','assessorEmail','assessorName',
    // Group A raw
    'neck','neckMod','trunk','trunkMod','legs','legsMod',
    'loadScore','loadShock',
    // Group B raw
    'upperArm','upperArmMod','lowerArm','wrist','wristMod','couplingScore',
    // Activity
    'activityScore',
    // Computed
    'scoreA','scoreB','scoreC','finalScore','riskLevel',
    // Meta
    'notes','imageUrls','status','createdAt','updatedAt','deleted','deletedAt',
  ];

  // ── List ──────────────────────────────────────────────────

  function list(filter) {
    let rows = Db.readAll(SHEET).filter(r => !r.deleted);
    if (filter) {
      if (filter.riskLevel) rows = rows.filter(r => r.riskLevel === filter.riskLevel);
      if (filter.status)    rows = rows.filter(r => r.status    === filter.status);
      if (filter.search) {
        const q = filter.search.toLowerCase();
        rows = rows.filter(r =>
          (r.jobTask     || '').toLowerCase().includes(q) ||
          (r.department  || '').toLowerCase().includes(q) ||
          (r.workerName  || '').toLowerCase().includes(q)
        );
      }
    }
    // Sort newest first
    rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    // Attach action plan count
    const plans = Db.readAll(CONFIG.SHEETS.ACTION_PLANS).filter(p => !p.deleted);
    return rows.map(r => ({
      ...r,
      actionPlanCount: plans.filter(p => p.assessmentId === r.id).length,
      openPlanCount:   plans.filter(p => p.assessmentId === r.id && p.status !== 'completed').length,
    }));
  }

  // ── Get single ────────────────────────────────────────────

  function getById(id) {
    const row = Db.findById(SHEET, id);
    if (!row || row.deleted) return null;

    // Attach action plans
    row.actionPlans = ActionPlanService.listByAssessment(id);

    // Attach child re-assessments (one level only)
    const children = Db.readAll(SHEET)
      .filter(r => String(r.parentId) === String(id) && !r.deleted)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    row.reAssessments = children;

    // Attach parent if this is a re-assessment
    if (row.parentId) {
      row.parentAssessment = Db.findById(SHEET, row.parentId);
    }

    // Re-attach calculated result from engine (server-side confirm)
    if (row.neck) {
      row.calcResult = RebaEngine.calculate(_extractInput(row));
    }

    return row;
  }

  // ── Save (create or update draft) ────────────────────────

  function save(data) {
    const user = getCurrentUser();
    const now  = Db.now();

    // Always (re)calculate on save — never trust client score
    const input  = _extractInput(data);
    const result = RebaEngine.calculate(input);

    if (data.id) {
      // Update existing draft
      const existing = Db.findById(SHEET, data.id);
      if (!existing || existing.status === 'submitted') {
        throw new Error('Cannot edit a submitted assessment. Create a re-assessment instead.');
      }
      const changes = _buildRow(data, result, user, now, existing.createdAt);
      delete changes.id;
      delete changes.createdAt;
      changes.updatedAt = now;
      return Db.update(SHEET, data.id, changes);
    }

    // New assessment
    const id  = Db.newId();
    const row = _buildRow(data, result, user, now, now);
    row.id = id;
    return Db.insert(SHEET, row);
  }

  // ── Submit (lock assessment) ──────────────────────────────

  function submit(id) {
    const existing = Db.findById(SHEET, id);
    if (!existing) throw new Error('Assessment not found: ' + id);
    if (existing.status === 'submitted') throw new Error('Already submitted.');
    return Db.update(SHEET, id, { status: 'submitted', updatedAt: Db.now() });
  }

  // ── Soft delete ───────────────────────────────────────────

  function remove(id) {
    const existing = Db.findById(SHEET, id);
    if (!existing) throw new Error('Not found: ' + id);
    if (existing.status === 'submitted') {
      requireRole(CONFIG.ROLES.ADMIN);
    }
    return Db.softDelete(SHEET, id);
  }

  // ── Full report object for PDF ────────────────────────────

  function getFullReport(id) {
    const assessment = getById(id);
    if (!assessment) throw new Error('Not found: ' + id);
    return {
      assessment,
      calcResult:    RebaEngine.calculate(_extractInput(assessment)),
      actionPlans:   assessment.actionPlans,
      reAssessments: assessment.reAssessments,
      generatedAt:   Db.now(),
    };
  }

  // ── Private helpers ───────────────────────────────────────

  function _extractInput(data) {
    return {
      neck:          Number(data.neck)          || 1,
      neckMod:       Number(data.neckMod)       || 0,
      trunk:         Number(data.trunk)         || 1,
      trunkMod:      Number(data.trunkMod)      || 0,
      legs:          Number(data.legs)          || 1,
      legsMod:       Number(data.legsMod)       || 0,
      loadScore:     Number(data.loadScore)     || 0,
      loadShock:     Number(data.loadShock)     || 0,
      upperArm:      Number(data.upperArm)      || 1,
      upperArmMod:   Number(data.upperArmMod)   || 0,
      lowerArm:      Number(data.lowerArm)      || 1,
      wrist:         Number(data.wrist)         || 1,
      wristMod:      Number(data.wristMod)      || 0,
      couplingScore: Number(data.couplingScore) || 0,
      activityScore: Number(data.activityScore) || 0,
    };
  }

  function _buildRow(data, result, user, now, createdAt) {
    return {
      parentId:       data.parentId       || '',
      jobTask:        data.jobTask        || '',
      department:     data.department     || '',
      workerName:     data.workerName     || '',
      assessmentDate: data.assessmentDate || now.split('T')[0],
      assessorEmail:  user.email,
      assessorName:   user.name,
      // Group A
      neck:           data.neck          || 1,
      neckMod:        data.neckMod       || 0,
      trunk:          data.trunk         || 1,
      trunkMod:       data.trunkMod      || 0,
      legs:           data.legs          || 1,
      legsMod:        data.legsMod       || 0,
      loadScore:      data.loadScore     || 0,
      loadShock:      data.loadShock     || 0,
      // Group B
      upperArm:       data.upperArm      || 1,
      upperArmMod:    data.upperArmMod   || 0,
      lowerArm:       data.lowerArm      || 1,
      wrist:          data.wrist         || 1,
      wristMod:       data.wristMod      || 0,
      couplingScore:  data.couplingScore || 0,
      activityScore:  data.activityScore || 0,
      // Computed
      scoreA:         result.scoreA,
      scoreB:         result.scoreB,
      scoreC:         result.scoreC,
      finalScore:     result.finalScore,
      riskLevel:      result.riskLevel,
      // Meta
      notes:          data.notes     || '',
      imageUrls:      data.imageUrls || '',
      status:         data.status    || 'draft',
      createdAt,
      updatedAt:      now,
      deleted:        false,
      deletedAt:      '',
    };
  }

  return { list, getById, save, submit, remove, getFullReport };

})();
