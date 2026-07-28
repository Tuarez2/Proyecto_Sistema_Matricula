'use strict';

const now = new Date();

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('facultades', [
      {
        id: 1,
        codigo: 'FING',
        nombre: 'Facultad de Ingenieria',
        estado: true,
        created_at: now,
        updated_at: now
      }
    ]);

    await queryInterface.bulkInsert('carreras', [
      {
        id: 1,
        facultad_id: 1,
        codigo: 'ISC',
        nombre: 'Ingenieria de Sistemas',
        duracion_semestres: 10,
        estado: true,
        created_at: now,
        updated_at: now
      }
    ]);

    await queryInterface.bulkInsert('asignaturas', [
      {
        id: 1,
        codigo: 'PROG101',
        nombre: 'Programacion I',
        creditos: 4,
        horas_teoricas: 3,
        horas_practicas: 2,
        estado: true,
        created_at: now,
        updated_at: now
      },
      {
        id: 2,
        codigo: 'BD201',
        nombre: 'Bases de Datos',
        creditos: 4,
        horas_teoricas: 3,
        horas_practicas: 2,
        estado: true,
        created_at: now,
        updated_at: now
      }
    ]);

    await queryInterface.bulkInsert('carrera_asignatura', [
      {
        carrera_id: 1,
        asignatura_id: 1,
        semestre: 1,
        obligatoria: true,
        created_at: now,
        updated_at: now
      },
      {
        carrera_id: 1,
        asignatura_id: 2,
        semestre: 4,
        obligatoria: true,
        created_at: now,
        updated_at: now
      }
    ]);

    await queryInterface.bulkInsert('docentes', [
      {
        id: 1,
        identificacion: 'DOC-1001',
        nombres: 'Ana Maria',
        apellidos: 'Torres',
        correo: 'ana.torres@universidad.edu',
        titulo: 'Magister en Ingenieria de Software',
        estado: true,
        created_at: now,
        updated_at: now
      }
    ]);

    await queryInterface.bulkInsert('periodos_academicos', [
      {
        id: 1,
        codigo: '2026-1',
        nombre: 'Primer Periodo 2026',
        fecha_inicio: '2026-02-01',
        fecha_fin: '2026-06-30',
        estado: true,
        created_at: now,
        updated_at: now
      }
    ]);

    await queryInterface.bulkInsert('cursos', [
      {
        id: 1,
        periodo_id: 1,
        asignatura_id: 1,
        docente_id: 1,
        paralelo: 'A',
        cupo_maximo: 30,
        horario: 'Lunes y miercoles 08:00-10:00',
        aula: 'B-201',
        estado: true,
        created_at: now,
        updated_at: now
      }
    ]);

    await queryInterface.bulkInsert('estudiantes', [
      {
        id: 1,
        carrera_id: 1,
        numero_matricula: 'MAT-2026-0001',
        identificacion: 'EST-1001',
        nombres: 'Carlos Andres',
        apellidos: 'Lopez',
        correo: 'carlos.lopez@universidad.edu',
        fecha_nacimiento: '2005-04-12',
        estado: true,
        created_at: now,
        updated_at: now
      }
    ]);

    await queryInterface.bulkInsert('matriculas', [
      {
        id: 1,
        estudiante_id: 1,
        curso_id: 1,
        fecha_matricula: '2026-01-20',
        estado: 'activa',
        created_at: now,
        updated_at: now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('matriculas', { id: [1] });
    await queryInterface.bulkDelete('estudiantes', { id: [1] });
    await queryInterface.bulkDelete('cursos', { id: [1] });
    await queryInterface.bulkDelete('periodos_academicos', { id: [1] });
    await queryInterface.bulkDelete('docentes', { id: [1] });
    await queryInterface.bulkDelete('carrera_asignatura', {
      carrera_id: [1],
      asignatura_id: [1, 2]
    });
    await queryInterface.bulkDelete('asignaturas', { id: [1, 2] });
    await queryInterface.bulkDelete('carreras', { id: [1] });
    await queryInterface.bulkDelete('facultades', { id: [1] });
  }
};
