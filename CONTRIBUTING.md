# Guia de colaboracion

## Requisitos

- Node.js 24.18.0 LTS
- npm
- MySQL para el backend
- Angular CLI mediante npx o dependencias locales

## Preparacion inicial

```bash
git clone <repositorio>
cd Proyecto_Sistema_Matricula
nvm use
npm run instalar
```

## Comandos raiz

```bash
npm run verificar:entorno
npm run instalar
npm run dev:backend
npm run dev:frontend
npm run test:backend
npm run test:frontend
npm run build:frontend
npm run validar
```

## Flujo Git

El flujo es:

```text
rama de trabajo -> desarrollo -> main
```

Cada integrante debe iniciar desde `desarrollo` actualizado:

```bash
git switch desarrollo
git pull --rebase origin desarrollo
git switch -c feature/nombre-tarea
```

Antes de entregar:

```bash
git fetch origin
git rebase origin/desarrollo
npm run validar
git push -u origin feature/nombre-tarea
```

No se debe:

- Trabajar directamente en `main`.
- Usar force push.
- Subir `.env`.
- Subir `node_modules`.
- Mezclar backend y frontend sin necesidad en un mismo commit.
- Modificar carpetas asignadas a otro integrante sin coordinacion.

## Convencion de commits

Usa mensajes en espanol y en infinitivo:

```text
Implementar autenticacion del frontend
Crear listado de estudiantes
Corregir validacion de periodos
Agregar pruebas de matriculas
```

Evita mensajes como:

```text
cambios
arreglos
update
final
prueba
```

## Division recomendada del frontend

| Integrante | Area principal | Carpetas |
| --- | --- | --- |
| Integrante 1 | Autenticacion y sesion | `frontend/src/app/features/autenticacion`, `frontend/src/app/core/guards`, `frontend/src/app/core/interceptors` |
| Integrante 2 | Usuarios y roles | `frontend/src/app/features/usuarios` |
| Integrante 3 | Facultades, carreras, asignaturas y malla | `frontend/src/app/features/facultades`, `frontend/src/app/features/carreras`, `frontend/src/app/features/asignaturas`, `frontend/src/app/features/malla-curricular` |
| Integrante 4 | Estudiantes, docentes, periodos y cursos | `frontend/src/app/features/estudiantes`, `frontend/src/app/features/docentes`, `frontend/src/app/features/periodos-academicos`, `frontend/src/app/features/cursos` |
| Integrante 5 | Matriculas, integracion y pruebas | `frontend/src/app/features/matriculas` y pruebas de integracion frontend |

`app.routes.ts`, `app.config.ts`, layouts y componentes compartidos requieren coordinacion. Solo una tarea a la vez debe modificar archivos centrales.

Los componentes reutilizables deben acordarse antes de moverlos a `shared/`. Los modelos compartidos deben revisarse antes de agregarse a `core/models/`.

## Zonas de conflicto

Estos archivos y carpetas son sensibles y sus cambios deben ser pequenos y coordinados:

```text
frontend/src/app/app.routes.ts
frontend/src/app/app.config.ts
frontend/src/app/layouts/
frontend/src/app/shared/
frontend/src/app/core/models/
backend/src/routes/index.js
backend/src/app.js
backend/package.json
frontend/package.json
package.json
package-lock.json
```
