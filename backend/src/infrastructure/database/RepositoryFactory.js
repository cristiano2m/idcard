const config = require('../config/config');

let instances = {};

function getPersonRepository() {
  if (!instances.person) {
    if (config.dbDriver === 'mdb-hybrid') {
      const MdbPersonRepository = require('./mdb/MdbPersonRepository');
      instances.person = new MdbPersonRepository();
    } else {
      const SqlitePersonRepository = require('./sqlite/SqlitePersonRepository');
      instances.person = new SqlitePersonRepository();
    }
  }
  return instances.person;
}

function getUserRepository() {
  if (!instances.user) {
    const SqliteUserRepository = require('./sqlite/SqliteUserRepository');
    instances.user = new SqliteUserRepository();
  }
  return instances.user;
}

function getHistoryRepository() {
  if (!instances.history) {
    const SqliteHistoryRepository = require('./sqlite/SqliteHistoryRepository');
    instances.history = new SqliteHistoryRepository();
  }
  return instances.history;
}

function getSettingsRepository() {
  if (!instances.settings) {
    const SqliteSettingsRepository = require('./sqlite/SqliteSettingsRepository');
    instances.settings = new SqliteSettingsRepository();
  }
  return instances.settings;
}

module.exports = { getPersonRepository, getUserRepository, getHistoryRepository, getSettingsRepository };
