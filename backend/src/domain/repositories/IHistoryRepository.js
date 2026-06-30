class IHistoryRepository {
  async record(entry) { throw new Error('Not implemented'); }
  async listByPerson(personId) { throw new Error('Not implemented'); }
  async listAll(filters, { page = 1, pageSize = 50 } = {}) { throw new Error('Not implemented'); }
}

module.exports = IHistoryRepository;
