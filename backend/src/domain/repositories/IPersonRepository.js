class IPersonRepository {
  async create(personData) { throw new Error('Not implemented'); }
  async findById(id) { throw new Error('Not implemented'); }
  async findByDocumentId(documentoId) { throw new Error('Not implemented'); }
  async update(id, partialData) { throw new Error('Not implemented'); }
  async softDelete(id) { throw new Error('Not implemented'); }
  async changeStatus(id, nuevoEstado) { throw new Error('Not implemented'); }
  async list({ page = 1, pageSize = 20 } = {}) { throw new Error('Not implemented'); }
  async search(filters, { page = 1, pageSize = 20 } = {}) { throw new Error('Not implemented'); }
  async countByStatus() { throw new Error('Not implemented'); }
  async getRecent(limit) { throw new Error('Not implemented'); }
}

module.exports = IPersonRepository;
