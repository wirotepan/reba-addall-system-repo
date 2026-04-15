// ============================================================
// DashboardService.gs — Dashboard aggregation
// All calculations done in-memory from cached Sheet data.
// ============================================================

const DashboardService = (() => {

  function getDashboard() {
    const assessments = Db.readAll(CONFIG.SHEETS.ASSESSMENTS)
      .filter(r => !r.deleted && r.status === 'submitted');
    const plans = Db.readAll(CONFIG.SHEETS.ACTION_PLANS)
      .filter(p => !p.deleted);

    const riskOrder  = ['negligible','low','medium','high','very_high'];
    const riskCounts = {};
    riskOrder.forEach(r => { riskCounts[r] = 0; });
    assessments.forEach(a => {
      if (riskCounts[a.riskLevel] !== undefined) riskCounts[a.riskLevel]++;
    });

    // Top 5 jobs/tasks with highest avg score
    const byJob = {};
    assessments.forEach(a => {
      const k = a.jobTask || '(ไม่ระบุ)';
      if (!byJob[k]) byJob[k] = { total: 0, count: 0 };
      byJob[k].total += Number(a.finalScore) || 0;
      byJob[k].count++;
    });
    const topJobs = Object.entries(byJob)
      .map(([job, d]) => ({ job, avgScore: Math.round((d.total / d.count) * 10) / 10, count: d.count }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);

    // Monthly trend (last 6 months)
    const trend = _monthlyTrend(assessments, 6);

    // Action plan summary
    const planStats = {
      total:     plans.length,
      open:      plans.filter(p => p.status === 'open').length,
      inProgress:plans.filter(p => p.status === 'in_progress').length,
      completed: plans.filter(p => p.status === 'completed').length,
      overdue:   plans.filter(p =>
        p.status !== 'completed' && p.dueDate && new Date(p.dueDate) < new Date()
      ).length,
    };

    // Recent assessments (last 5)
    const recent = assessments
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(a => ({
        id: a.id, jobTask: a.jobTask, department: a.department,
        finalScore: a.finalScore, riskLevel: a.riskLevel,
        assessmentDate: a.assessmentDate,
      }));

    return {
      totalAssessments: assessments.length,
      riskCounts,
      topJobs,
      trend,
      planStats,
      recent,
    };
  }

  function _monthlyTrend(assessments, months) {
    const result = [];
    const now    = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year  = d.getFullYear();
      const month = d.getMonth();
      const label = `${year}-${String(month + 1).padStart(2, '0')}`;
      const rows  = assessments.filter(a => {
        const ad = new Date(a.assessmentDate || a.createdAt);
        return ad.getFullYear() === year && ad.getMonth() === month;
      });
      result.push({
        label,
        count:    rows.length,
        avgScore: rows.length
          ? Math.round((rows.reduce((s, a) => s + (Number(a.finalScore) || 0), 0) / rows.length) * 10) / 10
          : 0,
      });
    }
    return result;
  }

  return { getDashboard };

})();
