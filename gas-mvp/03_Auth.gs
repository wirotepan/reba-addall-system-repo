// ============================================================
// Auth.gs — User authentication & role helpers
// Uses Google Session (no custom login needed).
// For Gmail POC: first user to runSetup() becomes admin.
// ============================================================

/**
 * Get the current logged-in user object.
 * Returns: { email, name, role } or null if not in Users sheet.
 * Unknown users get role = 'safety_officer' by default (POC behaviour).
 */
function getCurrentUser() {
  const email = Session.getActiveUser().getEmail();
  if (!email) return null;

  const users = Db.readAll(CONFIG.SHEETS.USERS);
  const found = users.find(u => u.email === email && !u.deleted);

  if (found) {
    return { email: found.email, name: found.name, role: found.role };
  }

  // POC: auto-register unknown Google users as safety_officer
  const newUser = {
    id:        Db.newId(),
    email,
    name:      email.split('@')[0],
    role:      CONFIG.ROLES.SAFETY_OFFICER,
    createdAt: Db.now(),
    deleted:   false,
  };
  Db.insert(CONFIG.SHEETS.USERS, newUser);
  return { email: newUser.email, name: newUser.name, role: newUser.role };
}

/** Check if current user has a given role */
function hasRole(...roles) {
  const user = getCurrentUser();
  return user && roles.includes(user.role);
}

/** Guard function — throws if user is not in the allowed roles */
function requireRole(...roles) {
  if (!hasRole(...roles)) {
    throw new Error('Permission denied. Required roles: ' + roles.join(', '));
  }
}

/** List all users (admin only) */
function listUsers() {
  requireRole(CONFIG.ROLES.ADMIN);
  return Db.readAll(CONFIG.SHEETS.USERS).filter(u => !u.deleted);
}

/** Update a user's role (admin only) */
function updateUserRole(userId, newRole) {
  requireRole(CONFIG.ROLES.ADMIN);
  return Db.update(CONFIG.SHEETS.USERS, userId, { role: newRole, updatedAt: Db.now() });
}
