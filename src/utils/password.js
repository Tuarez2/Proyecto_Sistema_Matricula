import bcrypt from 'bcrypt';

const RONDAS_SALT = 12;

export const generarHashPassword = (password) => bcrypt.hash(password, RONDAS_SALT);

export const compararPassword = (password, hashAlmacenado) => bcrypt.compare(password, hashAlmacenado);
