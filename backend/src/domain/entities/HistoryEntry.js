class HistoryEntry {
  constructor({ id, personId, userId, accion, estadoResultante, ipAddress, userAgent, detalle, createdAt }) {
    this.id = id;
    this.personId = personId ?? null;
    this.userId = userId ?? null;
    this.accion = accion;
    this.estadoResultante = estadoResultante ?? null;
    this.ipAddress = ipAddress ?? null;
    this.userAgent = userAgent ?? null;
    this.detalle = detalle ?? null;
    this.createdAt = createdAt;
  }
}

module.exports = HistoryEntry;
