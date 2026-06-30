class Person {
  constructor({
    id,
    mdbRecordId,
    nombre,
    apellido,
    equipo,
    documentoId,
    fechaNacimiento,
    numeroCamiseta,
    fotoPath,
    firmaPath,
    qrPath,
    qrValue,
    barcodeValue,
    estado = 'Pendiente',
    createdByUserId,
    createdAt,
    updatedAt,
    deletedAt,
  }) {
    this.id = id;
    this.mdbRecordId = mdbRecordId ?? null;
    this.nombre = nombre;
    this.apellido = apellido;
    this.equipo = equipo;
    this.documentoId = documentoId;
    this.fechaNacimiento = fechaNacimiento ?? null;
    this.numeroCamiseta = numeroCamiseta ?? null;
    this.fotoPath = fotoPath ?? null;
    this.firmaPath = firmaPath ?? null;
    this.qrPath = qrPath ?? null;
    this.qrValue = qrValue ?? null;
    this.barcodeValue = barcodeValue ?? null;
    this.estado = estado;
    this.createdByUserId = createdByUserId ?? null;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt ?? null;
  }

  get fullName() {
    return `${this.nombre} ${this.apellido}`;
  }
}

module.exports = Person;
