# Contrato API

Base: `http://localhost:3000/api`. JSON UTF-8. Todas las rutas salvo login requieren `Authorization: Bearer <accessToken>`.

## Endpoints por página

| Página                | Método | Ruta                                                           | Respuesta / uso                                                              |
| --------------------- | ------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Login                 | POST   | `/auth/login`                                                  | Credenciales → token, vencimiento y usuario                                  |
| Usuarios              | POST   | `/auth/users`                                                  | Crear usuario; guarda hash scrypt, no la contraseña; 201                     |
| Perfil/header         | GET    | `/auth/me`                                                     | id, email, name, role, roleId                                                |
| Roles                 | GET    | `/auth/roles`                                                  | Catálogo de roles: id, name                                                  |
| Sesión                | POST   | `/auth/logout`                                                 | Invalida sesión actual; 204                                                  |
| Header/sidebar/footer | GET    | `/organization`                                                | Marca, nombre, temporada, textos                                             |
| Resumen               | GET    | `/dashboard?date=2026-10-10`                                   | Métricas, agenda, próxima competencia, equipos, primeras 4 tareas pendientes |
| Resumen/sidebar       | GET    | `/dashboard/stats`                                             | Totales de equipos, jugadores, win rate y pendientes                         |
| Equipos               | GET    | `/teams`                                                       | Equipos con jugadores                                                        |
| Equipos               | POST   | `/teams`                                                       | Crear equipo y su área; 201                                                  |
| Equipos               | GET    | `/teams/:id`                                                   | Equipo y roster                                                              |
| Equipos               | PUT    | `/teams/:id`                                                   | Editar nombre, short, sub y win rate                                         |
| Equipos               | DELETE | `/teams/:id`                                                   | Eliminar equipo, área, roster y eventos/tareas del área; 204                 |
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
| Finanzas              | GET    | `/finance/categories`                                          | Categorías de ingreso/egreso                                                 |
| Finanzas              | POST   | `/finance/categories`                                          | Crear categoría; 201                                                         |
| Finanzas              | PUT    | `/finance/categories/:id`                                      | Editar categoría                                                             |
| Finanzas              | DELETE | `/finance/categories/:id`                                      | Eliminar si no tiene movimientos; 204                                        |
| Finanzas              | GET    | `/finance/movements?kind=egreso&from=&to=&categoryId=`         | Listado de ingresos y egresos                                                |
| Finanzas              | GET    | `/finance/movements/:id`                                       | Movimiento con categoría y detalle                                           |
| Finanzas              | POST   | `/finance/movements`                                           | Registrar ingreso o egreso; 201                                              |
| Finanzas              | PUT    | `/finance/movements/:id`                                       | Editar movimiento                                                            |
| Finanzas              | DELETE | `/finance/movements/:id`                                       | Eliminar; 204                                                                |
| Finanzas              | GET    | `/finance/summary?from=&to=`                                   | Totales de ingresos, egresos y balance                                       |
| Finanzas              | GET    | `/finance/charts/monthly?year=2026`                            | 12 meses: ingresos, egresos, balance                                         |
| Finanzas              | GET    | `/finance/charts/categories?kind=egreso&from=&to=`             | Totales por categoría para gráficos                                          |
| Scouting              | GET    | `/scouting/players?game=Valorant&status=Seguimiento`           | Listado con rating promedio, conteos                                         |
| Scouting              | POST   | `/scouting/players`                                            | Crear prospecto; 201                                                         |
| Scouting              | GET    | `/scouting/players/:id`                                        | Detalle con características y observaciones                                  |
| Scouting              | PUT    | `/scouting/players/:id`                                        | Editar ficha                                                                 |
| Scouting              | DELETE | `/scouting/players/:id`                                        | Eliminar ficha, traits y observaciones; 204                                  |
| Scouting              | PUT    | `/scouting/players/:id/traits`                                 | Reemplaza características (rating 1–10)                                      |
| Scouting              | GET    | `/scouting/players/:id/observations`                           | Observaciones del prospecto                                                  |
| Scouting              | POST   | `/scouting/players/:id/observations`                           | Agregar observación; 201                                                     |
| Scouting              | PUT    | `/scouting/observations/:id`                                   | Editar observación                                                           |
| Scouting              | DELETE | `/scouting/observations/:id`                                   | Eliminar observación; 204                                                    |

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
    "role": "admin",
    "roleId": 1
  }
}
```

### Usuario: POST `/auth/users`

Requiere sesión de `admin` o `manager`. La contraseña se hashea con scrypt y salt aleatorio; la respuesta nunca incluye `password` ni `passwordHash`.

```json
{
  "email": "coach@nexus.gg",
  "name": "Coach",
  "password": "MinimoDoce1!",
  "role": "viewer"
}
```

`role` es opcional: `admin`, `manager` o `viewer` (por defecto `viewer`). Debe existir en la tabla `roles`. Contraseña mínima: 12 caracteres. Correo duplicado: 409.

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

`players: []` vacía el roster; máximo 50 jugadores. La respuesta incluye el equipo actualizado. Al escribir enviar solo `name` y `role`, no los IDs recibidos. También se acepta el array suelto: `[{ "name": "zephyr", "role": "Duelista" }]`.

### Equipo: POST y PUT

```json
{
  "name": "Rocket League",
  "short": "RL",
  "sub": "Roster principal",
  "win": 50
}
```

El `id` lo genera el servidor a partir del nombre (slug). Al editar, el `id` no cambia; si cambia `name`, se actualiza también el área vinculada (calendario y tareas). `win` es un entero 0–100. Nombre duplicado (equipo o área): 409. DELETE elimina el equipo, su área, el roster y los eventos/tareas de esa área.

### Finanzas: movimiento POST y PUT

```json
{
  "kind": "egreso",
  "categoryId": "uuid-de-categoria",
  "amount": 85000.5,
  "date": "2026-10-10",
  "concept": "Viaje a LAN",
  "detail": "Pasajes y hotel del roster Valorant"
}
```

`kind`: `ingreso` o `egreso`. `detail` describe a qué corresponde el gasto o ingreso. La categoría debe existir y su `kind` ser `ambos` o coincidir con el movimiento. Los gráficos (`/finance/charts/monthly` y `/finance/charts/categories`) se calculan desde los movimientos; no hay que persistir series.

### Scouting: jugador POST y PUT

```json
{
  "name": "Martín Pérez",
  "nickname": "volt",
  "game": "Valorant",
  "role": "Duelista",
  "age": 19,
  "country": "Argentina",
  "status": "Seguimiento",
  "contact": "volt#LAN"
}
```

`status`: Seguimiento / Contactado / Prueba / Fichado / Descartado. El listado trae `rating` (promedio 1–10), `traitsCount` y `observationsCount`. El detalle (`GET /scouting/players/:id`) incluye `traits` y `observations`.

Características (`PUT /scouting/players/:id/traits`):

```json
{
  "traits": [
    { "name": "Aim", "rating": 8, "note": "Consistente" },
    { "name": "Comunicación", "rating": 6 }
  ]
}
```

Observación:

```json
{
  "date": "2026-10-10",
  "author": "Coach",
  "title": "Primer VOD",
  "content": "Buen entry, le cuesta el post-plant."
}
```

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
6. En POST/PUT de eventos y tareas se puede enviar `id` y `areaId`; se ignoran. El servidor asigna el UUID al crear y usa el de la ruta al editar.
7. `saveTeam`: enviar el array de `{name, role}` (o `{ players: [...] }`) a PUT `/teams/{id}/players`.
8. `toggleTask`: PATCH con el estado deseado. Es explícito e idempotente; no invierte a ciegas si se reintenta una petición.
9. `logout`: POST `/auth/logout` y luego limpiar el estado local.

Los equipos mantienen los IDs `valorant`, `cs2` y `lol`. Los IDs demo `e1`/`t1` se reemplazan por UUID en SQL; cargar los datos desde la API antes de modificar registros. El proyecto no migra automáticamente localStorage del prototipo.

## Errores

- 400: DTO inválido, propiedades desconocidas, área inexistente, fecha/hora inválida.
- 401: credenciales incorrectas, token ausente, revocado o vencido.
- 403: viewer (u otro rol sin escritura) intentando modificar.
- 404: registro inexistente.
- 409: conflicto de unicidad.
- 429: límite de solicitudes.
- 500: fallo interno; no se expone SQL ni credenciales.

PUT requiere todos los campos definidos. No hay endpoint para cambiar contraseñas.
