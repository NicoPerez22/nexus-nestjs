# NEXUS HQ — API NestJS + PostgreSQL

Backend de las páginas de NEXUS HQ Angular 21. NestJS 11, TypeORM 0.3 y PostgreSQL 17. Cada página tiene su controller, service y module dentro de `src/feature`. Las versiones exactas quedan fijadas en `package-lock.json`.

## Inicio local

Requisitos: Node.js 22 o 24, npm y Docker Compose (o un servidor PostgreSQL 17 existente).

1. Descomprimir el proyecto y abrir una terminal en esta carpeta.
2. Copiar `.env.example` a `.env` (`cp .env.example .env` en macOS/Linux o `Copy-Item .env.example .env` en PowerShell).
3. Cambiar `SEED_ADMIN_PASSWORD` por una contraseña de al menos 12 caracteres.
4. `npm ci`
5. `docker compose up -d --wait db`
6. `npm run db:migrate`
7. `npm run db:seed`
8. `npm run start:dev`

API: http://localhost:3000/api. Angular autorizado por CORS: http://localhost:4200.

El correo inicial viene de `SEED_ADMIN_EMAIL`; la contraseña es la que configuraste. No se usa el login local del ZIP anterior. El seed no modifica contraseñas de usuarios ya existentes.

Docker crea la base `nexus_hq` y mantiene sus datos en un volumen. Las credenciales de PostgreSQL del Compose son exclusivamente para desarrollo local. Si usás otro servidor, creá una base vacía y configurá `DATABASE_URL`. No se debe exponer PostgreSQL a Internet.

## Comandos

- `npm run start:dev`: iniciar TypeScript (reiniciar tras cambios).
- `npm run build`: compilar a `dist`.
- `npm start`: ejecutar la versión compilada.
- `npm run db:migrate`: crear tablas e índices mediante migración transaccional.
- `npm run db:seed`: insertar organización, administrador, tres equipos, 15 jugadores, áreas, cuatro eventos y cuatro tareas de ejemplo.
- `npm test`: compilar y ejecutar pruebas HTTP de integración con TypeORM y pg-mem.
- `docker compose stop`: detener PostgreSQL conservando los datos.

`db:seed` es reejecutable: no duplica registros ni sobreescribe datos existentes. Si un registro demo se eliminó, lo vuelve a insertar. No correrlo como tarea automática en producción. Las fechas del seed se basan en el día en que se ejecuta, según la zona del proceso. El resumen por defecto usa la fecha de Argentina.

## Estructura

- `src/feature/auth`: login, perfil actual y cierre de sesión.
- `src/feature/dashboard`: resumen y métricas.
- `src/feature/teams`: equipos y edición transaccional de roster.
- `src/feature/calendar`: agenda, filtros y CRUD de eventos.
- `src/feature/tasks`: filtros, CRUD y estado de tareas.
- `src/feature/organization`: datos de marca, temporada y footer para el layout.
- `src/common`: DTOs, validación, guard, contraseñas, áreas y errores de base de datos.
- `src/database`: entidades, migración, conexión y seed.
- `database/001-schema.sql`: SQL PostgreSQL completo como referencia o instalación manual.
- `docs/API.md`: endpoints y contratos para conectar Angular.
- `docs/requests.http`: peticiones de ejemplo para REST Client.
- `test/api.test.cjs`: pruebas de integración HTTP.

Los componentes header/sidebar/footer no necesitan tres controllers idénticos: consumen `/auth/me`, `/organization`, `/teams` y `/dashboard/stats`.

## Base SQL y TypeORM

Tablas: `users`, `sessions`, `organization`, `teams`, `players`, `areas`, `events`, `tasks`; además TypeORM crea su tabla `migrations`.

Las áreas representan un equipo o un área interna. Los eventos y tareas almacenan `area_id`, con claves foráneas; la API devuelve `team` como nombre para conservar la forma usada por Angular. Los jugadores pertenecen a un equipo. La columna `position` conserva el orden del roster. Los índices cubren agenda, equipo/área y estado/fecha de tareas.

Las operaciones del proyecto se resuelven con repositorios, QueryBuilder y transacciones de TypeORM. **No se necesitan procedimientos almacenados** para estas consultas. El dashboard deriva sus totales de los registros persistidos, sin estadísticas duplicadas. El win rate de cada equipo es un valor del seed: no existe integración con resultados de partidas. El win rate global es el promedio simple de los equipos, como en Angular.

La migración es la ruta recomendada. El archivo SQL refleja el mismo esquema. **No ejecutar el SQL manual y luego la migración sobre esa misma base**, porque intentaría crear tablas existentes. El seed funciona con cualquiera de las dos rutas.

`synchronize` está desactivado. Las migraciones no corren silenciosamente al iniciar el servidor. La edición completa del roster usa transacción y bloqueo del equipo para evitar reemplazos parcialmente aplicados. Los IDs de jugadores se regeneran al reemplazar el roster; no hay referencias externas a jugadores en este modelo.

Documentación oficial: https://docs.nestjs.com/techniques/database y https://docs.nestjs.com/techniques/validation.

## Autenticación y alcance

Contraseñas protegidas con scrypt y salt aleatorio. Login devuelve un token aleatorio opaco; la base almacena únicamente SHA-256 del token. Todas las rutas salvo login requieren `Authorization: Bearer TOKEN`. Las sesiones expiran (8 horas por defecto) y logout las elimina del servidor. La contraseña y su hash nunca se devuelven por API.

Roles: `manager` puede leer y modificar; `viewer` solo leer y cerrar su sesión. El seed crea un manager. No hay registro público ni administración de usuarios en este alcance; corresponden a funcionalidades nuevas respecto de Angular.

Límite general: 120 solicitudes/minuto/IP; login: 5/minuto/IP. El limitador es local a cada proceso. Para múltiples instancias hace falta un almacén compartido y configurar correctamente el proxy. No habilitar confianza irrestricta en cabeceras de IP.

Este backend gestiona **una sola organización**: las cuentas autorizadas comparten los datos. No implementa multi-tenancy. Antes de producción: credenciales propias, TLS, secretos fuera del repositorio, backups y política de usuarios. `who` es un responsable textual como en el frontend, no una cuenta de usuario relacionada.

## Angular

Este ZIP contiene el backend y la base, **no modifica automáticamente el Angular descargado antes**. Los contratos de respuesta mantienen `team`, `who`, `win`, `players`, `date` y `time`. Para conectarlo, sustituí la persistencia local de `WorkspaceService` por HttpClient y el login demo por `/auth/login`. Ver `docs/API.md`.

## Verificación incluida

Compilación TypeScript y cinco pruebas de integración HTTP aprobadas: autenticación/perfil/organización, métricas y roster, CRUD de eventos, CRUD y estado de tareas, seed/roles/revocación/expiración. Usan pg-mem (emulación PostgreSQL), no un servidor PostgreSQL real. El Compose y la migración se entregan para ejecutar la base real; no se ha validado Docker en este entorno. Los tests comprueban operaciones y contratos, pero no sustituyen pruebas de concurrencia con PostgreSQL real.
