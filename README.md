# Sistema de Matricula Universitaria - Backend

Backend base para un Sistema de Matricula Universitaria construido con Node.js, Express, JavaScript ES Modules, Sequelize 6 y MySQL.

## Tecnologias

- Node.js
- Express
- JavaScript ES Modules
- Sequelize 6
- MySQL con mysql2
- dotenv
- bcrypt
- express-validator
- jsonwebtoken preparado para una fase futura

## Requisitos

- Node.js 18 o superior
- MySQL
- Base de datos creada previamente

## Instalacion

```bash
npm install
```

## Configuracion de MySQL

Crea la base de datos indicada en `DB_NAME` y configura `.env` a partir de `.env.example`:

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=matricula_universitaria
DB_USER=root
DB_PASSWORD=
INITIAL_ADMIN_FIRST_NAME=Administrador
INITIAL_ADMIN_LAST_NAME=Sistema
INITIAL_ADMIN_EMAIL=admin@universidad.edu
INITIAL_ADMIN_PASSWORD=CambiarEstaClave123
```

## Comandos

```bash
npm run db:migrate
npm run db:migrate:undo
npm run db:migrate:undo:all
npm run db:seed
npm run db:seed:undo
npm run db:seed:undo:all
npm run dev
npm start
```

## Estructura

```text
backend/
  src/
    config/
    models/
    controllers/
    services/
    validators/
    routes/
    middlewares/
    constants/
    utils/
    app.js
    server.js
  migrations/
  seeders/
  tests/
    unit/
    integration/
```

## Modelos

- Rol
- Usuario
- Sesion
- Facultad
- Carrera
- Estudiante
- Asignatura
- CarreraAsignatura
- Docente
- PeriodoAcademico
- Curso
- Matricula

## Roles Disponibles

- ADMIN
- GESTOR_MATRICULA
- ESTUDIANTE
- DOCENTE

## Alcance Actual

Esta fase deja implementada la estructura base, configuracion de entorno, conexion a MySQL, modelos, asociaciones, migraciones, seeders, constantes, utilidades y archivos base de capas.

## Pendiente

- Login funcional
- JWT funcional
- CRUD de negocio
- Logica transaccional de matricula
- Validaciones completas de negocio
- Documentacion Swagger

No se usa TypeScript, `tsconfig.json`, compilacion a `dist`, Docker ni `sequelize.sync()`.
