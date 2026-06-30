class IUserRepository {
  async create(userData) { throw new Error('Not implemented'); }
  async findById(id) { throw new Error('Not implemented'); }
  async findByUsername(username) { throw new Error('Not implemented'); }
  async update(id, partialData) { throw new Error('Not implemented'); }
  async delete(id) { throw new Error('Not implemented'); }
  async list() { throw new Error('Not implemented'); }
  async updateLastLogin(id) { throw new Error('Not implemented'); }
}

module.exports = IUserRepository;
