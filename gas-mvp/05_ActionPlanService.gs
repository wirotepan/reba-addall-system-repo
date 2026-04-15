// ============================================================
// ActionPlanService.gs — Corrective action plan CRUD
// ============================================================

const ActionPlanService = (() => {

  const SHEET = CONFIG.SHEETS.ACTION_PLANS;

  function listByAssessment(assessmentId) {
    return Db.readAll(SHEET)
      .filter(p => String(p.assessmentId) === String(assessmentId) && !p.deleted)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  function save(data) {
    const user = getCurrentUser();
    const now  = Db.now();

    if (data.id) {
      return Db.update(SHEET, data.id, {
        controlType:       data.controlType       || '',
        description:       data.description       || '',
        responsiblePerson: data.responsiblePerson || '',
        dueDate:           data.dueDate           || '',
        status:            data.status            || 'open',
        notes:             data.notes             || '',
        updatedAt:         now,
        updatedBy:         user.email,
      });
    }

    const row = {
      id:                Db.newId(),
      assessmentId:      data.assessmentId,
      controlType:       data.controlType       || '',
      description:       data.description       || '',
      responsiblePerson: data.responsiblePerson || '',
      dueDate:           data.dueDate           || '',
      status:            'open',
      notes:             data.notes             || '',
      createdAt:         now,
      createdBy:         user.email,
      updatedAt:         now,
      updatedBy:         user.email,
      completedAt:       '',
      deleted:           false,
      deletedAt:         '',
    };
    return Db.insert(SHEET, row);
  }

  function updateStatus(id, newStatus) {
    const now = Db.now();
    const changes = { status: newStatus, updatedAt: now };
    if (newStatus === 'completed') changes.completedAt = now;
    return Db.update(SHEET, id, changes);
  }

  function remove(id) {
    return Db.softDelete(SHEET, id);
  }

  return { listByAssessment, save, updateStatus, remove };

})();
