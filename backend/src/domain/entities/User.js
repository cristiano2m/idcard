const ROLES = ['Administrador', 'Operador', 'Supervisor'];

class User {
  constructor({ id, username, passwordHash, fullName, role, isActive, lastLoginAt, createdAt, updatedAt }) {
    this.id = id;
    this.username = username;
    this.passwordHash = passwordHash;
    this.fullName = fullName;
    this.role = role;
    this.isActive = isActive !== undefined ? Boolean(isActive) : true;
    this.lastLoginAt = lastLoginAt ?? null;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toPublic() {
    const { passwordHash, ...pub } = this;
    return pub;
  }
}

User.ROLES = ROLES;
module.exports = User;
