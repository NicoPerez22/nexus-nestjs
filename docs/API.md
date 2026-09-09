# Contrato API

Base: `http://localhost:3000/api`. JSON UTF-8. Todas las rutas salvo login requieren `Authorization: Bearer <accessToken>`.

## Endpoints por página

| Página                | Método | Ruta                                                           | Respuesta / uso                                                              |
| --------------------- | ------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Login                 | POST   | `/auth/login`                                                  | Credenciales → token, vencimiento y usuario                                  |
| Perfil/header         | GET    | `/auth/me`                                                     | id, email, name, role                                                        |
| Sesión                | POST   | `/auth/logout`                                                 | Invalida sesión actual; 204                                                  |
| Header/sidebar/footer | GET    | `/organization`                                                | Marca, nombre, temporada, textos                                             |
| Resumen               | GET    | `/dashboard?date=2026-10-10`                                   | Métricas, agenda, próxima competencia, equipos, primeras 4 tareas pendientes |
| Resumen/sidebar       | GET    | `/dashboard/stats`                                             | Totales de equipos, jugadores, win rate y pendientes                         |
| Equipos               | GET    | `/teams`                                                       | Equipos con jugadores                                                        |
| Equipos               | GET    | `/teams/:id`                                                   | Equipo y roster                                                              |
| Equipos               | GET    | `/teams/:id/players`                                           | Lista ordenada de jugadores                                                  |
| Equipos               | PUT    | `/teams/:id/players`                                           | Reemplaza roster completo en transacción                                     |
| Calendario            | GET    | `/calendar/events/areas`                                       | Áreas disponibles: id, name, teamId                                          |
| Calendario            | GET    | `/calendar/events?team=Valorant&from=2026-10-01&to=2026-10-31` | Eventos ordenados por fecha/hora; filtros opcionales e inclusivos            |
| Calendario            | GET    | `/calendar/events/:id`                                         | Evento                                                                       |
| Calendario            | POST   | `/calendar/events`                                             | Crear evento; 201                                                            |
| Calendario            | PUT    | `/calendar/events/:id`                                         | Editar todos los campos del evento                                           |
| Calendario            | DELETE | `/calendar/events/:id`                                         | Eliminar; 204                                                                |
| Tareas                | GET    | `/tasks/areas`                                                 | Áreas disponibles                                                            |
| Tareas                | GET    | `/tasks?status=pending&team=Valorant`                          | status = all / pending / completed; filtros opcionales                       |
| Tareas                | GET    | `/tasks/:id`                                                   | Tarea                                                                        |
| Tareas                | POST   | `/tasks`                                                       | Crear tarea; 201                                                             |
| Tareas                | PUT    | `/tasks/:id`                                                   | Editar todos los campos de la tarea                                          |
| Tareas                | PATCH  | `/tasks/:id/status`                                            | Completar o reabrir con `{ "done": true/false }`                             |
| Tareas                | DELETE | `/tasks/:id`                                                   | Eliminar; 204                                                                |

No enviar `team=Todos`: omitir ese parámetro cuando no hay filtro. Los listados devuelven arrays completos como requiere el frontend actual; para grandes volúmenes se deberá incorporar paginación con su correspondiente adaptación de UI.

### Login

```json
{ "email": "admin@nexus.gg", "password": "TU_PASSWORD_DEL_ENV" }
```

Respuesta:

```json
{
  "accessToken": "token-opaco",
  "tokenType": "Bearer",
  "expiresAt": "2026-10-10T20:00:00.000Z",
  "user": {
    "id": "uuid",
    "email": "admin@nexus.gg",
    "name": "Admin",
    "role": "manager"
  }
}
```

### Evento: POST y PUT

```json
{
  "name": "Scrim vs. Leviatán",
  "team": "Valorant",
  "date": "2026-10-10",
  "time": "18:00",
  "type": "Entrenamiento"
}
```

Respuesta añade `id` (UUID) y `areaId`. `type`: Entrenamiento / Competencia / Reunión. Fechas válidas `YYYY-MM-DD`, hora `HH:mm`. Son fecha y hora locales de Argentina, sin conversión automática. Las áreas internas también pueden tener eventos, como permitía la demo.

### Tarea: POST y PUT

```json
{
  "name": "Preparar análisis",
  "team": "Staff técnico",
  "who": "Lucía",
  "due": "2026-10-10",
  "priority": true,
  "done": false
}
```

Respuesta añade `id` (UUID) y `areaId`. `priority` y `done` deben ser booleanos JSON, no strings.

### Roster: PUT

```json
{
  "players": [
    { "name": "zephyr", "role": "Duelista" },
    { "name": "kaizen", "role": "Iniciador" }
  ]
}
```

`players: []` vacía el roster; máximo 50 jugadores. La respuesta incluye el equipo actualizado. Al escribir enviar solo `name` y `role`, no los IDs recibidos.

### Resumen

```json
{
  "date": "2026-10-10",
  "stats": {
    "activeTeams": 3,
    "players": 15,
    "winRate": 72,
    "pendingTasks": 4,
    "dueToday": 2
  },
  "todayEvents": [],
  "nextCompetition": null,
  "teams": [],
  "pendingTasks": []
}
```

Arrays ilustrativos; los valores reales salen de SQL. `dueToday` incluye pendientes vencidas y de hoy, reproduciendo el criterio Angular. Próxima competencia es la primera a partir de esa fecha, incluyendo el día consultado. Si no hay competencia, es null. El dashboard se calcula con varias lecturas; no promete una instantánea transaccional ante escrituras simultáneas.

## Integración con Angular 21

1. Registrar `provideHttpClient()` en `app.config.ts`.
2. `AuthService.login`: POST de credenciales; conservar sesión/token según la estrategia elegida y usar `/auth/me` para validar la sesión al restaurarla. Un guard de frontend no autoriza operaciones por sí mismo.
3. Agregar un interceptor que adjunte `Authorization` solo a esta API. Ante 401, borrar sesión y redirigir a login. No enviar el token a URLs externas. Para una versión de producción se puede migrar a cookies HttpOnly con protección CSRF; este contrato utiliza Bearer.
4. Sustituir carga local por GET `/teams`, `/calendar/events` y `/tasks`; también puede cargarse `/dashboard` para la portada.
5. Usar el objeto devuelto por POST/PUT/PATCH para actualizar los Signals después de respuesta exitosa. No mostrar confirmación antes de que termine la petición.
6. Crear: no generar UUID en Angular; el servidor lo asigna. Editar: quitar `id` y `areaId` del body; van solo los campos de los DTOs. El UUID va en la ruta.
7. `saveTeam`: enviar `{players: team.players.map(({name,role})=>({name,role}))}` a PUT `/teams/{id}/players`.
8. `toggleTask`: PATCH con el estado deseado. Es explícito e idempotente; no invierte a ciegas si se reintenta una petición.
9. `logout`: POST `/auth/logout` y luego limpiar el estado local.

Los equipos mantienen los IDs `valorant`, `cs2` y `lol`. Los IDs demo `e1`/`t1` se reemplazan por UUID en SQL; cargar los datos desde la API antes de modificar registros. El proyecto no migra automáticamente localStorage del prototipo.

## Errores

- 400: DTO inválido, propiedades desconocidas, área inexistente, fecha/hora inválida.
- 401: credenciales incorrectas, token ausente, revocado o vencido.
- 403: viewer intentando modificar.
- 404: registro inexistente.
- 409: conflicto de unicidad.
- 429: límite de solicitudes.
- 500: fallo interno; no se expone SQL ni credenciales.

PUT requiere todos los campos definidos. No hay endpoint para cambiar contraseñas, crear equipos o editar win rate porque esas operaciones no existían en la UI entregada.
