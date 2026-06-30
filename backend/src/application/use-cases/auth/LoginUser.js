const { compare } = require('../../services/PasswordService');
const UnauthorizedError = require('../../../domain/errors/UnauthorizedError');
const { getUserRepository, getHistoryRepository } = require('../../../infrastructure/database/RepositoryFactory');
const { sign } = require('../../../infrastructure/auth/JwtService');

async function loginUser({ username, password, ipAddress, userAgent }) {
  const userRepo = getUserRepository();
  const user = await userRepo.findByUsername(username);

  if (!user || !user.isActive) throw new UnauthorizedError('Credenciales inválidas');

  const ok = await compare(password, user.passwordHash);
  if (!ok) throw new UnauthorizedError('Credenciales inválidas');

  await userRepo.updateLastLogin(user.id);

  await getHistoryRepository().record({
    userId: user.id,
    accion: 'LOGIN',
    ipAddress,
    userAgent,
    detalle: { username },
  });

  const token = sign({ id: user.id, username: user.username, role: user.role });
  return { token, user: user.toPublic() };
}

module.exports = { loginUser };
