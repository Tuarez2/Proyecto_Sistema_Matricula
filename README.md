# Sistema de Matrícula Universitaria

Aplicación web para la gestión de matrícula universitaria: administra estudiantes, docentes, facultades, carreras, asignaturas, malla curricular, periodos académicos, cursos y el proceso de matrícula con sus comprobantes. Incluye autenticación por roles, portales diferenciados para estudiantes y gestores, filtros, paginación y opciones de accesibilidad.

Proyecto académico desarrollado como parte de la asignatura de Desarrollo Web.

## Producción

| Aspecto | Detalle |
| --- | --- |
| URL pública | https://sistema-matricula-production.up.railway.app |
| Health check | https://sistema-matricula-production.up.railway.app/health |
| Estado del despliegue | Operativo (aplicación y base de datos en Railway) |
| Stack resumido | Angular, Node.js, Express, Sequelize, MySQL, Docker, Railway |

El health check responde `200 OK` con `{"success":true,"status":"ok"}`. Las credenciales de acceso se gestionan mediante variables de entorno y no se publican en este documento.

## Descripción

El sistema está centrado en la **gestión de la matrícula universitaria**. Permite estructurar la oferta académica (facultades, carreras, asignaturas, malla curricular, periodos y cursos), registrar estudiantes y docentes, y realizar el proceso de matrícula de estudiantes en cursos dentro de un periodo académico.

No es un sistema académico completo de calificaciones: el modelo de matrícula registra el estado académico de la matrícula (inscrita, aprobada, reprobada, retirada, anulada) y una nota final opcional, pero no gestiona evaluaciones ni un proceso de calificación docente.

## Características

- **Autenticación y seguridad:** inicio de sesión, tokens de acceso y renovación, cierre de sesión, control de acceso por roles, rate limiting, cabeceras de seguridad (Helmet), CORS restringido y validación de entradas.
- **Usuarios:** administración de cuentas, cambio de estado (activo, bloqueado, inactivo) y cambio de contraseña.
- **Estudiantes:** registro, edición, consulta y listado con filtros.
- **Docentes:** registro, edición, consulta y listado con filtros.
- **Facultades:** administración de facultades.
- **Carreras:** administración de carreras vinculadas a facultades.
- **Asignaturas:** administración de asignaturas con créditos y nivel académico.
- **Malla curricular:** asignación de asignaturas a carreras.
- **Periodos académicos:** administración y cambio de estado (planificado, matrícula abierta, en curso, cerrado).
- **Cursos:** administración de cursos por periodo, asignatura, paralelo, aula, horario y cupo máximo.
- **Matrículas:** registro, renovación, consulta, detalle e impresión de comprobante.
- **Portales:** dashboard del gestor con resumen de matrículas y portal del estudiante con su historial.
- **Filtros y paginación:** consultas paginadas y filtros en los listados.
- **Preferencias y accesibilidad:** tema claro/oscuro, tamaño de texto, densidad, contraste reforzado, foco reforzado y movimiento reducido.

## Roles

| Rol | Código interno | Propósito |
| --- | --- | --- |
| Administrador | `ADMIN` | Acceso administrativo completo al sistema. |
| Gestor de matrícula | `GESTOR_MATRICULA` | Gestión operativa de los procesos de matrícula. |
| Estudiante | `ESTUDIANTE` | Consulta su información y su historial de matrículas. |
| Docente | `DOCENTE` | Consulta de la información académica disponible. |

Los permisos se validan en el backend (middleware `authorizeRoles`) y en el frontend (guardas de rutas por rol), de modo que una ruta protegida exige autorización en ambas capas.

## Arquitectura

```text
Navegador (Angular)
      │
      ▼
Node.js + Express (backend, Railway)
      │
      ▼
Sequelize (ORM)
      │
      ▼
MySQL (Railway)
```

En producción el backend sirve también el frontend compilado: el `Dockerfile` construye la aplicación Angular y el servidor Express expone `frontend/dist/frontend/browser` como contenido estático, redirigiendo las rutas no API al `index.html`.

## Estructura del proyecto

```text
.
├── backend/                  # API REST (Node.js + Express + Sequelize)
│   ├── src/
│   │   ├── config/           # Entorno, base de datos, CORS, logging
│   │   ├── constants/        # Constantes del dominio y roles
│   │   ├── controllers/      # Controladores HTTP
│   │   ├── services/         # Lógica de negocio
│   │   ├── validators/       # Validaciones (express-validator)
│   │   ├── routes/           # Rutas de la API
│   │   ├── middlewares/      # Autenticación, roles, rate limit, errores
│   │   ├── models/           # Modelos Sequelize y asociaciones
│   │   └── utils/            # Utilidades (JWT, paginación, passwords)
│   ├── migrations/           # Migraciones de base de datos
│   ├── seeders/              # Seeders iniciales (roles, admin)
│   ├── scripts/              # Auditoría y dataset temporal de video
│   └── tests/                # Pruebas unitarias e integración
├── frontend/                 # Aplicación Angular
│   └── src/app/
│       ├── core/             # Servicios, guardas, interceptores, config
│       ├── features/         # Módulos por dominio (usuarios, matrículas, etc.)
│       ├── layouts/          # Layouts de autenticación y principal
│       ├── pages/            # Páginas genéricas (inicio, 404, acceso denegado)
│       └── shared/           # Componentes, pipes y utilidades compartidas
├── scripts/                  # Verificación de entorno (raíz)
├── Dockerfile                # Imagen de producción
└── railway.json              # Configuración de despliegue en Railway
```

## Tecnologías

### Frontend

| Tecnología | Uso |
| --- | --- |
| Angular | Framework de la interfaz de usuario |
| TypeScript | Lenguaje de la aplicación |
| RxJS | Programación reactiva |
| Vitest / jsdom | Pruebas de componentes y servicios |

### Backend

| Tecnología | Uso |
| --- | --- |
| Node.js | Entorno de ejecución |
| Express | Framework HTTP |
| Sequelize 6 | ORM y migraciones |
| express-validator | Validación de solicitudes |
| jsonwebtoken | Tokens de acceso y renovación |
| bcrypt | Hash de contraseñas |
| Helmet / CORS / express-rate-limit | Seguridad de la API |
| Vitest / supertest | Pruebas |

### Base de datos

| Tecnología | Uso |
| --- | --- |
| MySQL | Motor de base de datos relacional |
| mysql2 | Driver de conexión |

### DevOps / Despliegue

| Tecnología | Uso |
| --- | --- |
| Docker | Contenedor de producción |
| Railway | Plataforma de despliegue (app + MySQL) |

### Testing

| Tecnología | Uso |
| --- | --- |
| Vitest | Pruebas de backend y frontend |
| supertest | Pruebas de integración HTTP |
| Angular unit-test builder | Ejecución de pruebas del frontend |

## Requisitos

| Requisito | Versión |
| --- | --- |
| Node.js | `>=24.15.0 <25` (archivo de versión: `24.18.0`) |
| npm | `11.12.1` (definido en `frontend/package.json`) |
| MySQL | 8.x (compatible con la configuración del proyecto) |

La versión de Node está fijada en `package.json` (campo `engines`), `.nvmrc` y `.node-version`. No se soportan versiones fuera del rango definido.

## Instalación local

```bash
git clone https://github.com/Tuarez2/Proyecto_Sistema_Matricula.git
cd Proyecto_Sistema_Matricula
nvm use
npm run instalar
```

`npm run instalar` ejecuta la verificación de entorno y luego `npm ci` en `backend/` y `frontend/`.

## Variables de entorno

El backend requiere un archivo `.env` basado en `backend/.env.example`. Nombres de variables (con valores de ejemplo):

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=matricula_universitaria
DB_NAME_TEST=matricula_universitaria_test
DB_USER=root
DB_PASSWORD=

JWT_ACCESS_SECRET=change_this_access_secret
JWT_REFRESH_SECRET=change_this_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:4200,http://localhost:3000,http://localhost:5173
CORS_CREDENTIALS=false
TRUST_PROXY=false
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=10

INITIAL_ADMIN_FIRST_NAME=Administrador
INITIAL_ADMIN_LAST_NAME=Sistema
INITIAL_ADMIN_EMAIL=admin@universidad.edu
INITIAL_ADMIN_PASSWORD=CambiarEstaClave123
```

> **Advertencia:** NO subas `.env` ni secretos al repositorio. Las claves de firma JWT y las contraseñas de producción deben ser valores únicos y seguros, distintos de los que aparecen en `.env.example`.

## Ejecución local

Backend:

```bash
npm run dev:backend
```

Frontend:

```bash
npm run dev:frontend
```

El backend escucha en el puerto definido por `PORT` (por defecto `3000`) y expone la API bajo `/api/v1`. El frontend se sirve con Angular CLI (por defecto en `http://localhost:4200`). Los secretos y credenciales se leen desde `backend/.env`.

## Pruebas

```bash
npm run test:backend
npm run test:frontend
```

Última validación ejecutada en esta tarea: **2275 frontend / 220 backend** (todas en verde).

## TypeScript y build

El frontend usa TypeScript con el esquema de build de Angular:

```bash
npm run build:frontend
```

Validador integral (verificación de entorno + pruebas + build):

```bash
npm run validar
npm run validar:backend
npm run validar:frontend
```

## Auditoría de datos

Se ejecuta con:

```bash
npm --prefix backend run auditar:datos
```

El script `backend/scripts/auditar-datos.js` revisa los registros de estudiantes y docentes en busca de incumplimientos (patrones de identificación, teléfono y correo, edad mínima, longitudes, caracteres inválidos y duplicados) y reporta los hallazgos. **Solo detecta y reporta; no elimina ni modifica registros automáticamente.** Termina con código de salida distinto de cero si existen hallazgos.

## Seguridad

- **Contraseñas:** hash con `bcrypt`.
- **Tokens:** JWT para acceso y renovación, con secretos separados y expiración configurable.
- **Renovación de sesión:** refresh token almacenado con hash (HMAC-SHA256), vinculado a una sesión revocable en base de datos.
- **Roles:** control de acceso por rol en backend (`authorizeRoles`) y guardas de ruta en frontend.
- **Rate limiting:** límites generales de API y específicos para los endpoints de autenticación.
- **Helmet:** cabeceras de seguridad HTTP.
- **CORS:** orígenes permitidos explícitos (se prohíbe `*` en producción).
- **Validaciones:** `express-validator` y reglas de negocio en el backend.
- **Manejo de errores en producción:** respuestas JSON estandarizadas sin trazas de pila en producción.

## Docker

El `Dockerfile` usa la imagen `node:24-bookworm-slim`, instala las dependencias de `backend/` y `frontend/` con `npm ci`, compila el frontend con Angular, y expone el puerto `8080`. Al iniciar, ejecuta las migraciones, los seeders iniciales (roles y administrador) y levanta el servidor Express, que sirve tanto la API como el frontend compilado.

```bash
docker build -t sistema-matricula .
docker run -p 8080:8080 --env-file backend/.env sistema-matricula
```

## Railway

La aplicación está desplegada en Railway como un único servicio Docker con una base de datos MySQL gestionada por la plataforma:

```text
Railway
├── MySQL
└── sistema-matricula (app)
```

- Configuración declarada en `railway.json` (builder Dockerfile, healthcheck en `/health` y política de reinicio ante fallos).
- Las variables de entorno se inyectan desde la plataforma (incluido `MYSQL_URL` para la base de datos).
- El servidor usa `process.env.PORT` (`8080` en el Dockerfile) y expone `/health` para el healthcheck de la plataforma.

## Dataset de demostración

Para preparaciones temporales de demostración existen dos scripts:

```bash
npm run seed:video
npm run cleanup:video
```

- Son de uso **temporal** para demostraciones y presentaciones.
- Los registros se identifican con el marcador `VIDEO_DEMO_2026`.
- El dataset de video requiere la variable `VIDEO_DEMO_PASSWORD`; la contraseña se lee de la variable de entorno y **no se publica en el repositorio**.
- No debe ejecutarse como seed de producción normal; para datos iniciales reales se usan los seeders de `backend/seeders/`.
- `cleanup:video` elimina los registros temporales creados.

## Flujo Git

```text
feature/fix/hotfix  →  desarrollo  →  main
```

- `main` es la rama estable y de producción.
- `desarrollo` es la rama de integración.
- Las ramas `feature/`, `fix/` y `hotfix/` son temporales para trabajo en curso.

La guía de colaboración completa está en `CONTRIBUTING.md`.

## Estado del proyecto

| Componente | Estado |
| --- | --- |
| Frontend | Aprobado (build exitoso y pruebas en verde) |
| Backend | Aprobado (pruebas de integración y unitarias en verde) |
| Base de datos | Aprobado (migraciones, seeders y pruebas contra MySQL) |
| Docker | Configurado (Dockerfile verificado) |
| Railway | Operativo (URL pública y health check respondiendo) |
| Health check | Aprobado (`200 OK`) |
| Tests | Aprobado (2275 frontend / 220 backend) |
| Build | Aprobado (`ng build` exitoso) |

## Alcance

El sistema **no cubre**:

- Calificaciones (módulo académico de notas).
- Aula virtual.
- Tareas.
- Biblioteca.
- Nómina.
- Gestión financiera.

## Equipo

- Cristhian Tuarez
- Bernardo Alvarado
- David Demera

## Proyecto académico

Sistema desarrollado como proyecto académico para la asignatura de Desarrollo Web. Integra un frontend en Angular con un backend en Node.js y Express, base de datos MySQL, contenedores Docker y despliegue en Railway, siguiendo buenas prácticas de versionado, pruebas y seguridad.

## Licencia

Proyecto académico y educativo. Revisar las condiciones definidas por los autores y la institución.
