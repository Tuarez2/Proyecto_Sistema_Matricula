'use strict';

const bcrypt = require('bcrypt');

const CONTRASENA_DOCENTE = 'DocenteDemo123!';
const CONTRASENA_ESTUDIANTE = 'EstudianteDemo123!';

const buscarId = async (queryInterface, Sequelize, tabla, columna, valor) => {
  const [registro] = await queryInterface.sequelize.query(
    `SELECT id FROM ${tabla} WHERE ${columna} = :valor LIMIT 1`,
    {
      replacements: { valor },
      type: Sequelize.QueryTypes.SELECT
    }
  );

  return registro ? registro.id : null;
};

const existeRegistro = async (queryInterface, Sequelize, consulta, valores) => {
  const [registro] = await queryInterface.sequelize.query(consulta, {
    replacements: valores,
    type: Sequelize.QueryTypes.SELECT
  });

  return Boolean(registro);
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const buscar = (tabla, columna, valor) =>
      buscarId(queryInterface, Sequelize, tabla, columna, valor);

    const rolEstudiante = await buscar('roles', 'codigo', 'ESTUDIANTE');
    const rolDocente = await buscar('roles', 'codigo', 'DOCENTE');

    if (!rolEstudiante || !rolDocente) {
      throw new Error('Seed de datos demo: los roles ESTUDIANTE y DOCENTE deben existir primero.');
    }

    // --- Facultad ---
    let facultadId = await buscar('facultades', 'codigo', 'FAC-ING');

    if (!facultadId) {
      await queryInterface.bulkInsert('facultades', [
        {
          codigo: 'FAC-ING',
          nombre: 'Facultad de Ingeniería',
          activo: true,
          created_at: now,
          updated_at: now
        }
      ]);
      facultadId = await buscar('facultades', 'codigo', 'FAC-ING');
    }

    // --- Carreras ---
    const carreras = [
      {
        codigo: 'ING-SIS',
        nombre: 'Ingeniería en Sistemas',
        duracion_semestres: 8,
        facultad_id: facultadId,
        activo: true
      },
      {
        codigo: 'ING-CIV',
        nombre: 'Ingeniería Civil',
        duracion_semestres: 8,
        facultad_id: facultadId,
        activo: true
      }
    ];

    for (const carrera of carreras) {
      const existe = await buscar('carreras', 'codigo', carrera.codigo);

      if (!existe) {
        await queryInterface.bulkInsert('carreras', [
          { ...carrera, created_at: now, updated_at: now }
        ]);
      }
    }

    // --- Asignaturas y malla de Ingeniería en Sistemas ---
    const carreraSistemas = await buscar('carreras', 'codigo', 'ING-SIS');
    const asignaturas = [
      {
        codigo: 'PROG-1',
        nombre: 'Programación I',
        creditos: 4,
        nivel_academico: 1,
        activo: true
      },
      {
        codigo: 'CALC-1',
        nombre: 'Cálculo Diferencial',
        creditos: 4,
        nivel_academico: 1,
        activo: true
      },
      {
        codigo: 'MATE-1',
        nombre: 'Matemáticas Discretas',
        creditos: 3,
        nivel_academico: 1,
        activo: true
      }
    ];

    for (const asignatura of asignaturas) {
      let asignaturaId = await buscar('asignaturas', 'codigo', asignatura.codigo);

      if (!asignaturaId) {
        await queryInterface.bulkInsert('asignaturas', [
          { ...asignatura, created_at: now, updated_at: now }
        ]);
        asignaturaId = await buscar('asignaturas', 'codigo', asignatura.codigo);
      }

      const vinculada = await existeRegistro(
        queryInterface,
        Sequelize,
        'SELECT 1 FROM carrera_asignatura WHERE carrera_id = :carrera_id AND asignatura_id = :asignatura_id LIMIT 1',
        { carrera_id: carreraSistemas, asignatura_id: asignaturaId }
      );

      if (!vinculada) {
        await queryInterface.bulkInsert('carrera_asignatura', [
          {
            carrera_id: carreraSistemas,
            asignatura_id: asignaturaId,
            created_at: now,
            updated_at: now
          }
        ]);
      }
    }

    // --- Periodo academico ---
    let periodoId = await buscar('periodos_academicos', 'codigo', '2026-B');

    if (!periodoId) {
      await queryInterface.bulkInsert('periodos_academicos', [
        {
          codigo: '2026-B',
          nombre: 'Segundo Semestre 2026',
          fecha_inicio: '2026-09-01',
          fecha_fin: '2027-02-26',
          fecha_inicio_matricula: new Date('2026-08-01T00:00:00.000Z'),
          fecha_fin_matricula: new Date('2026-09-15T23:59:59.000Z'),
          estado: 'matricula_abierta',
          created_at: now,
          updated_at: now
        }
      ]);
      periodoId = await buscar('periodos_academicos', 'codigo', '2026-B');
    }

    // --- Docentes ---
    const docentes = [
      {
        identificacion: '0912345678',
        nombres: 'María Fernanda',
        apellidos: 'Torres Gómez',
        correo: 'maria.torres@universidad.edu',
        telefono: '0991234567',
        especialidad: 'Ingeniería de Software',
        activo: true
      },
      {
        identificacion: '0987654321',
        nombres: 'Jorge Luis',
        apellidos: 'Salazar Díaz',
        correo: 'jorge.salazar@universidad.edu',
        telefono: '0997654321',
        especialidad: 'Matemáticas Aplicadas',
        activo: true
      }
    ];
    const docenteIds = {};

    for (const docente of docentes) {
      let docenteId = await buscar('docentes', 'identificacion', docente.identificacion);

      if (!docenteId) {
        await queryInterface.bulkInsert('docentes', [
          { ...docente, created_at: now, updated_at: now }
        ]);
        docenteId = await buscar('docentes', 'identificacion', docente.identificacion);
      }

      docenteIds[docente.correo] = docenteId;
    }

    // --- Estudiantes ---
    const estudiantes = [
      {
        numero_matricula: 'MAT-2026-001',
        nombres: 'Ana María',
        apellidos: 'Pérez Ramírez',
        identificacion: '1105123456',
        correo: 'ana.perez@universidad.edu',
        telefono: '0981112233',
        fecha_nacimiento: '2004-05-12',
        estado_academico: 'activo',
        nivel_academico_actual: 1,
        carrera_id: carreraSistemas
      },
      {
        numero_matricula: 'MAT-2026-002',
        nombres: 'Carlos Andrés',
        apellidos: 'Gómez Villarreal',
        identificacion: '1105234567',
        correo: 'carlos.gomez@universidad.edu',
        telefono: '0982223344',
        fecha_nacimiento: '2003-11-03',
        estado_academico: 'activo',
        nivel_academico_actual: 1,
        carrera_id: carreraSistemas
      },
      {
        numero_matricula: 'MAT-2026-003',
        nombres: 'Lucía Fernanda',
        apellidos: 'Fernández Ortiz',
        identificacion: '1105345678',
        correo: 'lucia.fernandez@universidad.edu',
        telefono: '0983334455',
        fecha_nacimiento: '2004-01-25',
        estado_academico: 'activo',
        nivel_academico_actual: 1,
        carrera_id: await buscar('carreras', 'codigo', 'ING-CIV')
      }
    ];
    const estudianteIds = {};

    for (const estudiante of estudiantes) {
      let estudianteId = await buscar('estudiantes', 'numero_matricula', estudiante.numero_matricula);

      if (!estudianteId) {
        await queryInterface.bulkInsert('estudiantes', [
          { ...estudiante, created_at: now, updated_at: now }
        ]);
        estudianteId = await buscar('estudiantes', 'numero_matricula', estudiante.numero_matricula);
      }

      estudianteIds[estudiante.correo] = estudianteId;
    }

    // --- Usuarios de acceso por perfil ---
    const passwordDocente = await bcrypt.hash(CONTRASENA_DOCENTE, 12);
    const passwordEstudiante = await bcrypt.hash(CONTRASENA_ESTUDIANTE, 12);
    const usuarios = [
      {
        nombres: 'María Fernanda',
        apellidos: 'Torres Gómez',
        correo: 'maria.torres@universidad.edu',
        password_hash: passwordDocente,
        estado: 'activo',
        rol_id: rolDocente,
        docente_id: docenteIds['maria.torres@universidad.edu'],
        estudiante_id: null
      },
      {
        nombres: 'Jorge Luis',
        apellidos: 'Salazar Díaz',
        correo: 'jorge.salazar@universidad.edu',
        password_hash: passwordDocente,
        estado: 'activo',
        rol_id: rolDocente,
        docente_id: docenteIds['jorge.salazar@universidad.edu'],
        estudiante_id: null
      },
      {
        nombres: 'Ana María',
        apellidos: 'Pérez Ramírez',
        correo: 'ana.perez@universidad.edu',
        password_hash: passwordEstudiante,
        estado: 'activo',
        rol_id: rolEstudiante,
        docente_id: null,
        estudiante_id: estudianteIds['ana.perez@universidad.edu']
      },
      {
        nombres: 'Carlos Andrés',
        apellidos: 'Gómez Villarreal',
        correo: 'carlos.gomez@universidad.edu',
        password_hash: passwordEstudiante,
        estado: 'activo',
        rol_id: rolEstudiante,
        docente_id: null,
        estudiante_id: estudianteIds['carlos.gomez@universidad.edu']
      },
      {
        nombres: 'Lucía Fernanda',
        apellidos: 'Fernández Ortiz',
        correo: 'lucia.fernandez@universidad.edu',
        password_hash: passwordEstudiante,
        estado: 'activo',
        rol_id: rolEstudiante,
        docente_id: null,
        estudiante_id: estudianteIds['lucia.fernandez@universidad.edu']
      }
    ];

    for (const usuario of usuarios) {
      const existe = await buscar('usuarios', 'correo', usuario.correo);

      if (!existe) {
        await queryInterface.bulkInsert('usuarios', [
          {
            ...usuario,
            debe_cambiar_password: true,
            ultimo_acceso: null,
            created_at: now,
            updated_at: now
          }
        ]);
      }
    }

    // --- Cursos del periodo ---
    const asignaturaProgramacion = await buscar('asignaturas', 'codigo', 'PROG-1');
    const asignaturaCalculo = await buscar('asignaturas', 'codigo', 'CALC-1');
    const asignaturaMatematicas = await buscar('asignaturas', 'codigo', 'MATE-1');
    const cursos = [
      {
        paralelo: 'A',
        aula: 'Lab-101',
        horario: 'Lunes y Miércoles 07:00 - 09:00',
        cupo_maximo: 40,
        estado: 'abierto',
        asignatura_id: asignaturaProgramacion,
        docente_id: docenteIds['maria.torres@universidad.edu'],
        periodo_id: periodoId
      },
      {
        paralelo: 'A',
        aula: 'Aula-204',
        horario: 'Martes y Jueves 10:00 - 12:00',
        cupo_maximo: 40,
        estado: 'abierto',
        asignatura_id: asignaturaCalculo,
        docente_id: docenteIds['jorge.salazar@universidad.edu'],
        periodo_id: periodoId
      },
      {
        paralelo: 'A',
        aula: 'Aula-210',
        horario: 'Lunes y Viernes 14:00 - 16:00',
        cupo_maximo: 40,
        estado: 'abierto',
        asignatura_id: asignaturaMatematicas,
        docente_id: docenteIds['jorge.salazar@universidad.edu'],
        periodo_id: periodoId
      }
    ];
    const cursoIds = {};

    for (const curso of cursos) {
      const existe = await existeRegistro(
        queryInterface,
        Sequelize,
        'SELECT 1 FROM cursos WHERE periodo_id = :periodo_id AND asignatura_id = :asignatura_id AND paralelo = :paralelo LIMIT 1',
        {
          periodo_id: curso.periodo_id,
          asignatura_id: curso.asignatura_id,
          paralelo: curso.paralelo
        }
      );

      if (!existe) {
        await queryInterface.bulkInsert('cursos', [
          { ...curso, created_at: now, updated_at: now }
        ]);
      }

      const [registroCurso] = await queryInterface.sequelize.query(
        'SELECT id FROM cursos WHERE periodo_id = :periodo_id AND asignatura_id = :asignatura_id AND paralelo = :paralelo LIMIT 1',
        {
          replacements: {
            periodo_id: curso.periodo_id,
            asignatura_id: curso.asignatura_id,
            paralelo: curso.paralelo
          },
          type: Sequelize.QueryTypes.SELECT
        }
      );

      cursoIds[curso.asignatura_id] = registroCurso.id;
    }

    // --- Matriculas completas ---
    const matriculas = [
      {
        estudiante_id: estudianteIds['ana.perez@universidad.edu'],
        curso_id: cursoIds[asignaturaProgramacion]
      },
      {
        estudiante_id: estudianteIds['carlos.gomez@universidad.edu'],
        curso_id: cursoIds[asignaturaCalculo]
      },
      {
        estudiante_id: estudianteIds['lucia.fernandez@universidad.edu'],
        curso_id: cursoIds[asignaturaMatematicas]
      }
    ];

    for (const matricula of matriculas) {
      const existe = await existeRegistro(
        queryInterface,
        Sequelize,
        'SELECT 1 FROM matriculas WHERE estudiante_id = :estudiante_id AND curso_id = :curso_id LIMIT 1',
        {
          estudiante_id: matricula.estudiante_id,
          curso_id: matricula.curso_id
        }
      );

      if (!existe) {
        await queryInterface.bulkInsert('matriculas', [
          {
            estudiante_id: matricula.estudiante_id,
            curso_id: matricula.curso_id,
            fecha_matricula: now,
            estado: 'inscrita',
            calificacion_final: null,
            created_at: now,
            updated_at: now
          }
        ]);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const correos = [
      'ana.perez@universidad.edu',
      'carlos.gomez@universidad.edu',
      'lucia.fernandez@universidad.edu',
      'maria.torres@universidad.edu',
      'jorge.salazar@universidad.edu'
    ];
    const identificaciones = ['1105123456', '1105234567', '1105345678', '0912345678', '0987654321'];

    const estudianteIds = await queryInterface.sequelize.query(
      'SELECT id FROM estudiantes WHERE identificacion IN (:identificaciones)',
      {
        replacements: { identificaciones },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (estudianteIds.length > 0) {
      await queryInterface.bulkDelete('matriculas', {
        estudiante_id: {
          [Sequelize.Op.in]: estudianteIds.map((registro) => registro.id)
        }
      });
    }

    await queryInterface.bulkDelete('usuarios', { correo: { [Sequelize.Op.in]: correos } });

    const cursoIds = await queryInterface.sequelize.query(
      'SELECT id FROM cursos WHERE aula IN (:aulas)',
      {
        replacements: { aulas: ['Lab-101', 'Aula-204', 'Aula-210'] },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (cursoIds.length > 0) {
      await queryInterface.bulkDelete('cursos', {
        id: { [Sequelize.Op.in]: cursoIds.map((registro) => registro.id) }
      });
    }

    await queryInterface.bulkDelete('estudiantes', {
      identificacion: { [Sequelize.Op.in]: identificaciones }
    });
    await queryInterface.bulkDelete('docentes', {
      identificacion: { [Sequelize.Op.in]: identificaciones }
    });

    const asignaturaIds = await queryInterface.sequelize.query(
      'SELECT id FROM asignaturas WHERE codigo IN (:codigos)',
      {
        replacements: { codigos: ['PROG-1', 'CALC-1', 'MATE-1'] },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (asignaturaIds.length > 0) {
      await queryInterface.bulkDelete('carrera_asignatura', {
        asignatura_id: {
          [Sequelize.Op.in]: asignaturaIds.map((registro) => registro.id)
        }
      });
      await queryInterface.bulkDelete('asignaturas', {
        id: { [Sequelize.Op.in]: asignaturaIds.map((registro) => registro.id) }
      });
    }

    await queryInterface.bulkDelete('carreras', {
      codigo: { [Sequelize.Op.in]: ['ING-SIS', 'ING-CIV'] }
    });
    await queryInterface.bulkDelete('periodos_academicos', { codigo: '2026-B' });
    await queryInterface.bulkDelete('facultades', { codigo: 'FAC-ING' });
  }
};
