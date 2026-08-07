import {
  EDAD_MINIMA_ESTUDIANTE,
  IDENTIFICACION_PATTERN,
  NOMBRES_PATTERN,
  TELEFONO_PATTERN
} from '../src/constants/domain.constants.js';
import { sequelize, Docente, Estudiante } from '../src/models/index.js';
import { calcularEdad } from '../src/validators/reglasComunes.js';

const hallazgos = [];

const reportar = (entidad, id, campo, valor, razon) => {
  hallazgos.push({ entidad, id, campo, valor, razon });
};

const analizarTexto = (entidad, id, campo, valor, razonVacio, longitudMaxima = 100) => {
  if (valor === null || valor === undefined) {
    reportar(entidad, id, campo, valor, 'El campo es nulo o indefinido.');
    return;
  }

  const texto = String(valor).trim();

  if (texto.length === 0) {
    reportar(entidad, id, campo, valor, razonVacio);
    return;
  }

  if (texto.length > longitudMaxima) {
    reportar(entidad, id, campo, valor, `Excede la longitud maxima de ${longitudMaxima} caracteres.`);
    return;
  }

  if (!NOMBRES_PATTERN.test(texto)) {
    reportar(entidad, id, campo, valor, 'Contiene caracteres no validos para un texto personal.');
  }
};

const analizarIdentificacion = (entidad, id, valor) => {
  if (valor === null || valor === undefined || !IDENTIFICACION_PATTERN.test(String(valor).trim())) {
    reportar(entidad, id, 'identificacion', valor, 'No cumple el patron de identificacion valida.');
  }
};

const analizarTelefono = (entidad, id, valor) => {
  if (valor !== null && valor !== undefined && valor !== '' && !TELEFONO_PATTERN.test(String(valor).trim())) {
    reportar(entidad, id, 'telefono', valor, 'No cumple el patron de telefono valido.');
  }
};

const analizarFechaNacimiento = (entidad, id, valor) => {
  const edad = calcularEdad(valor);

  if (edad === null) {
    reportar(entidad, id, 'fecha_nacimiento', valor, 'No es una fecha valida.');
    return;
  }

  if (edad < 0) {
    reportar(entidad, id, 'fecha_nacimiento', valor, 'La fecha es futura.');
    return;
  }

  if (edad < EDAD_MINIMA_ESTUDIANTE) {
    reportar(entidad, id, 'fecha_nacimiento', valor, `Edad menor a la minima (${EDAD_MINIMA_ESTUDIANTE} anios).`);
  }
};

const analizarCorreo = (entidad, id, valor) => {
  if (valor === null || valor === undefined || !String(valor).includes('@')) {
    reportar(entidad, id, 'correo', valor, 'El correo no es valido.');
  }
};

const analizarDuplicados = (entidad, registros, campo, etiqueta) => {
  const agrupados = new Map();

  registros.forEach((registro) => {
    const valor = String(registro[campo] ?? '').trim().toLowerCase();
    const grupo = agrupados.get(valor) ?? [];
    grupo.push(registro.id);
    agrupados.set(valor, grupo);
  });

  agrupados.forEach((ids, valor) => {
    if (ids.length > 1) {
      reportar(entidad, ids.join(', '), campo, valor, `${etiqueta} duplicado en ${ids.length} registros.`);
    }
  });
};

const auditar = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexion establecida con la base de datos.\n');

    const estudiantes = await Estudiante.findAll({ raw: true });
    const docentes = await Docente.findAll({ raw: true });

    estudiantes.forEach((estudiante) => {
      const { id, identificacion, nombres, apellidos, correo, telefono, fecha_nacimiento } = estudiante;
      analizarIdentificacion('Estudiante', id, identificacion);
      analizarTexto('Estudiante', id, 'nombres', nombres, 'Los nombres estan vacios.');
      analizarTexto('Estudiante', id, 'apellidos', apellidos, 'Los apellidos estan vacios.');
      analizarTelefono('Estudiante', id, telefono);
      analizarFechaNacimiento('Estudiante', id, fecha_nacimiento);
      analizarCorreo('Estudiante', id, correo);
    });

    docentes.forEach((docente) => {
      const { id, identificacion, nombres, apellidos, correo, telefono } = docente;
      analizarIdentificacion('Docente', id, identificacion);
      analizarTexto('Docente', id, 'nombres', nombres, 'Los nombres estan vacios.');
      analizarTexto('Docente', id, 'apellidos', apellidos, 'Los apellidos estan vacios.');
      analizarTelefono('Docente', id, telefono);
      analizarCorreo('Docente', id, correo);
    });

    analizarDuplicados('Estudiante', estudiantes, 'identificacion', 'Identificacion');
    analizarDuplicados('Estudiante', estudiantes, 'correo', 'Correo');
    analizarDuplicados('Estudiante', estudiantes, 'numero_matricula', 'Numero de matricula');
    analizarDuplicados('Docente', docentes, 'identificacion', 'Identificacion');
    analizarDuplicados('Docente', docentes, 'correo', 'Correo');

    if (hallazgos.length === 0) {
      console.log('Auditoria completada: no se encontraron registros con problemas.');
      return;
    }

    console.log(`Auditoria completada: ${hallazgos.length} hallazgo(s) detectado(s).\n`);

    hallazgos.forEach((hallazgo, indice) => {
      console.log(
        `${indice + 1}. [${hallazgo.entidad}] id=${hallazgo.id} campo=${hallazgo.campo} valor="${hallazgo.valor}" -> ${hallazgo.razon}`
      );
    });
  } finally {
    await sequelize.close();
  }
};

const main = async () => {
  try {
    await auditar();
    process.exitCode = hallazgos.length > 0 ? 1 : 0;
  } catch (error) {
    console.error('Error al ejecutar la auditoria:', error);
    process.exitCode = 2;
  }
};

main();
