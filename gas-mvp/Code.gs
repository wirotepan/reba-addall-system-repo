// ============================================================
// Code.gs — Entry point for REBA GAS Web App
// ============================================================

function doGet(e) {
  const user = getCurrentUser();
  const template = HtmlService.createTemplateFromFile('index');
  template.userJson = JSON.stringify(user);
  return template.evaluate()
    .setTitle('REBA Risk Assessment')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

/** Include helper — lets index.html use <?= include('StyleMain') ?> */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ── Exposed to client via google.script.run ──────────────────

function clientGetDashboard()            { return DashboardService.getDashboard(); }
function clientGetAssessments(filter)    { return AssessmentService.list(filter); }
function clientGetAssessment(id)         { return AssessmentService.getById(id); }
function clientSaveAssessment(data)      { return AssessmentService.save(data); }
function clientDeleteAssessment(id)      { return AssessmentService.remove(id); }

function clientGetActionPlans(assessId)  { return ActionPlanService.listByAssessment(assessId); }
function clientSaveActionPlan(data)      { return ActionPlanService.save(data); }
function clientUpdatePlanStatus(id, st)  { return ActionPlanService.updateStatus(id, st); }
function clientDeleteActionPlan(id)      { return ActionPlanService.remove(id); }

function clientGetReport(assessId)       { return AssessmentService.getFullReport(assessId); }
function clientGetCurrentUser()          { return getCurrentUser(); }

/** One-time setup — run manually from Apps Script editor */
function runSetup() { SetupService.initAll(); }
