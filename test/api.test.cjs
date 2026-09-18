const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { newDb, DataType } = require("pg-mem");
const { Test } = require("@nestjs/testing");
const { DataSource } = require("typeorm");
const request = require("supertest");
const { AppModule } = require("../dist/app.module");
const { entities, User, Session, Role } = require("../dist/database/entities");
const { Initial1788900000000 } = require("../dist/database/migrations/initial");
const { seedData } = require("../dist/database/seed-data");
const { setup } = require("../dist/setup");
let app, ds, api, token;
before(async () => {
  const db = newDb({ autoCreateForeignKeyIndices: true });
  db.public.registerFunction({
    name: "current_database",
    returns: DataType.text,
    implementation: () => "nexus_test",
  });
  db.public.registerFunction({
    name: "version",
    returns: DataType.text,
    implementation: () => "PostgreSQL 17",
  });
  ds = await db.adapters.createTypeormDataSource({
    type: "postgres",
    entities,
    migrations: [Initial1788900000000],
    synchronize: false,
  });
  await ds.initialize();
  await ds.runMigrations();
  await seedData(ds, "admin@nexus.gg", "IntegrationPass2026!");
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DataSource)
    .useValue(ds)
    .compile();
  app = module.createNestApplication();
  setup(app);
  await app.init();
  api = request(app.getHttpServer());
});
after(async () => {
  if (app) await app.close();
  else if (ds?.isInitialized) await ds.destroy();
});
const auth = () => ({ Authorization: `Bearer ${token}` });
test("protected resources, invalid credentials, login, profile and organization", async () => {
  await api.get("/api/teams").expect(401);
  await api
    .post("/api/auth/login")
    .send({ email: "admin@nexus.gg", password: "wrong" })
    .expect(401);
  const login = await api
    .post("/api/auth/login")
    .send({ email: "admin@nexus.gg", password: "IntegrationPass2026!" })
    .expect(200);
  token = login.body.accessToken;
  assert.equal(token.length, 64);
  assert.equal(login.body.user.passwordHash, undefined);
  const me = await api.get("/api/auth/me").set(auth()).expect(200);
  assert.equal(me.body.email, "admin@nexus.gg");
  assert.equal(me.body.role, "admin");
  const roles = await api.get("/api/auth/roles").set(auth()).expect(200);
  assert.ok(roles.body.some((r) => r.name === "admin"));
  const org = await api.get("/api/organization").set(auth()).expect(200);
  assert.equal(org.body.name, "Nexus Esports");
  await api
    .post("/api/auth/users")
    .send({
      email: "coach@nexus.gg",
      name: "Coach",
      password: "CoachPass2026!",
    })
    .expect(401);
  await api
    .post("/api/auth/users")
    .set(auth())
    .send({
      email: "short@nexus.gg",
      name: "Short",
      password: "corta",
    })
    .expect(400);
  const created = await api
    .post("/api/auth/users")
    .set(auth())
    .send({
      email: "Coach@nexus.gg",
      name: "Coach",
      password: "CoachPass2026!",
      role: "viewer",
    })
    .expect(201);
  assert.equal(created.body.email, "coach@nexus.gg");
  assert.equal(created.body.name, "Coach");
  assert.equal(created.body.role, "viewer");
  assert.equal(typeof created.body.roleId, "number");
  assert.equal(created.body.passwordHash, undefined);
  assert.equal(created.body.password, undefined);
  const stored = await ds
    .getRepository(User)
    .findOneBy({ email: "coach@nexus.gg" });
  assert.ok(stored.passwordHash.includes(":"));
  assert.notEqual(stored.passwordHash, "CoachPass2026!");
  const coachLogin = await api
    .post("/api/auth/login")
    .send({ email: "coach@nexus.gg", password: "CoachPass2026!" })
    .expect(200);
  assert.equal(coachLogin.body.user.email, "coach@nexus.gg");
  await api
    .post("/api/auth/users")
    .set(auth())
    .send({
      email: "coach@nexus.gg",
      name: "Coach",
      password: "CoachPass2026!",
    })
    .expect(409);
});
test("dashboard aggregates and roster persistence", async () => {
  const dashboard = await api.get("/api/dashboard").set(auth()).expect(200);
  assert.equal(dashboard.body.stats.players, 15);
  assert.equal(dashboard.body.stats.winRate, 72);
  await api
    .put("/api/teams/valorant/players")
    .set(auth())
    .send({ players: [{ name: "Neo", role: "IGL" }] })
    .expect(200);
  const roster = await api
    .get("/api/teams/valorant/players")
    .set(auth())
    .expect(200);
  assert.equal(roster.body.length, 1);
  assert.equal(roster.body[0].name, "Neo");
  await api
    .put("/api/teams/valorant/players")
    .set(auth())
    .send([
      { name: "Totijas", role: "IGL" },
      { name: "Lucasye", role: "Rifler" },
    ])
    .expect(200);
  assert.equal(
    (await api.get("/api/teams/valorant/players").set(auth())).body.length,
    2,
  );
  const stats = await api.get("/api/dashboard/stats").set(auth()).expect(200);
  assert.equal(stats.body.players, 12);
  await api
    .put("/api/teams/valorant/players")
    .set(auth())
    .send({ players: [{ name: " ", role: "IGL" }] })
    .expect(400);
  assert.equal(
    (await api.get("/api/teams/valorant/players").set(auth())).body.length,
    2,
  );
  const teamPayload = {
    name: "Rocket League",
    short: "RL",
    sub: "Roster principal",
    win: 50,
  };
  await api
    .post("/api/teams")
    .set(auth())
    .send({ ...teamPayload, win: 101 })
    .expect(400);
  await api
    .post("/api/teams")
    .set(auth())
    .send({ ...teamPayload, name: "Organización" })
    .expect(409);
  const createdTeam = await api
    .post("/api/teams")
    .set(auth())
    .send(teamPayload)
    .expect(201);
  assert.equal(createdTeam.body.id, "rocket-league");
  assert.equal(createdTeam.body.players.length, 0);
  await api.post("/api/teams").set(auth()).send(teamPayload).expect(409);
  const updatedTeam = await api
    .put(`/api/teams/${createdTeam.body.id}`)
    .set(auth())
    .send({ ...teamPayload, name: "RL Pro", win: 80 })
    .expect(200);
  assert.equal(updatedTeam.body.id, "rocket-league");
  assert.equal(updatedTeam.body.name, "RL Pro");
  assert.equal(updatedTeam.body.win, 80);
  await api.delete(`/api/teams/${createdTeam.body.id}`).set(auth()).expect(204);
  await api.get(`/api/teams/${createdTeam.body.id}`).set(auth()).expect(404);
});
test("event CRUD, filters and validation", async () => {
  const payload = {
    name: "Final",
    team: "Valorant",
    date: "2026-10-10",
    time: "19:30",
    type: "Competencia",
  };
  await api
    .post("/api/calendar/events")
    .set(auth())
    .send({ ...payload, date: "2026-02-30" })
    .expect(400);
  await api
    .post("/api/calendar/events")
    .set(auth())
    .send({ ...payload, team: "Missing" })
    .expect(400);
  await api
    .post("/api/calendar/events")
    .set(auth())
    .send({ ...payload, unexpected: true })
    .expect(400);
  const created = await api
    .post("/api/calendar/events")
    .set(auth())
    .send({
      ...payload,
      id: "64d30b4a-70be-4e3d-82b9-9b9c53091886",
      areaId: "ignored",
    })
    .expect(201);
  const id = created.body.id;
  assert.notEqual(id, "64d30b4a-70be-4e3d-82b9-9b9c53091886");
  assert.equal(created.body.time, "19:30");
  await api
    .put(`/api/calendar/events/${id}`)
    .set(auth())
    .send({ ...payload, name: "Semifinal" })
    .expect(200);
  const filtered = await api
    .get("/api/calendar/events?team=Valorant&from=2026-10-10&to=2026-10-10")
    .set(auth())
    .expect(200);
  assert.ok(filtered.body.some((e) => e.name === "Semifinal"));
  await api
    .get("/api/calendar/events?from=2026-10-11&to=2026-10-10")
    .set(auth())
    .expect(400);
  await api.delete(`/api/calendar/events/${id}`).set(auth()).expect(204);
  await api.get(`/api/calendar/events/${id}`).set(auth()).expect(404);
  await api.get("/api/calendar/events/not-uuid").set(auth()).expect(400);
});
test("task CRUD and explicit status updates", async () => {
  const payload = {
    name: "Revisar contrato",
    team: "Organización",
    who: "Nico",
    due: "2026-10-10",
    priority: true,
    done: false,
  };
  const created = await api
    .post("/api/tasks")
    .set(auth())
    .send(payload)
    .expect(201);
  const id = created.body.id;
  await api
    .put(`/api/tasks/${id}`)
    .set(auth())
    .send({ ...payload, who: "Lu" })
    .expect(200);
  await api
    .patch(`/api/tasks/${id}/status`)
    .set(auth())
    .send({ done: true })
    .expect(200);
  const completed = await api
    .get("/api/tasks?status=completed")
    .set(auth())
    .expect(200);
  assert.ok(completed.body.some((t) => t.id === id && t.who === "Lu"));
  await api
    .patch(`/api/tasks/${id}/status`)
    .set(auth())
    .send({ done: false })
    .expect(200);
  await api.delete(`/api/tasks/${id}`).set(auth()).expect(204);
  await api.get(`/api/tasks/${id}`).set(auth()).expect(404);
});
test("finance categories, movements and charts", async () => {
  const categories = await api
    .get("/api/finance/categories")
    .set(auth())
    .expect(200);
  assert.ok(categories.body.length >= 6);
  const sponsor = categories.body.find((c) => c.name === "Sponsors");
  const travel = categories.body.find((c) => c.name === "Viajes");
  await api
    .post("/api/finance/movements")
    .set(auth())
    .send({
      kind: "egreso",
      categoryId: sponsor.id,
      amount: 10,
      date: "2026-10-10",
      concept: "Mal",
      detail: "No aplica",
    })
    .expect(400);
  const movement = await api
    .post("/api/finance/movements")
    .set(auth())
    .send({
      kind: "egreso",
      categoryId: travel.id,
      amount: 1200.5,
      date: "2026-10-10",
      concept: "Comida staff",
      detail: "Cena post partido de CS2",
    })
    .expect(201);
  assert.equal(movement.body.category, "Viajes");
  assert.equal(movement.body.amount, 1200.5);
  assert.equal(movement.body.detail, "Cena post partido de CS2");
  const summary = await api
    .get("/api/finance/summary")
    .set(auth())
    .expect(200);
  assert.ok(summary.body.egresos >= 1200.5);
  const monthly = await api
    .get("/api/finance/charts/monthly?year=2026")
    .set(auth())
    .expect(200);
  assert.equal(monthly.body.months.length, 12);
  const byCategory = await api
    .get("/api/finance/charts/categories?kind=egreso")
    .set(auth())
    .expect(200);
  assert.ok(byCategory.body.items.some((i) => i.category === "Viajes"));
  await api
    .delete(`/api/finance/movements/${movement.body.id}`)
    .set(auth())
    .expect(204);
});
test("scouting list, detail, traits and observations", async () => {
  const list = await api.get("/api/scouting/players").set(auth()).expect(200);
  const volt = list.body.find((p) => p.nickname === "volt");
  assert.ok(volt);
  const detail = await api
    .get(`/api/scouting/players/${volt.id}`)
    .set(auth())
    .expect(200);
  assert.ok(detail.body.traits.length >= 2);
  assert.ok(detail.body.observations.length >= 1);
  const observation = await api
    .post(`/api/scouting/players/${volt.id}/observations`)
    .set(auth())
    .send({
      date: "2026-10-11",
      author: "Nico",
      title: "Scrim",
      content: "Mejoró el post-plant. Seguir invitando.",
    })
    .expect(201);
  const updated = await api
    .put(`/api/scouting/players/${volt.id}/traits`)
    .set(auth())
    .send({
      traits: [
        { name: "Aim", rating: 9, note: "Más estable" },
        { name: "Actitud", rating: 8 },
      ],
    })
    .expect(200);
  assert.equal(updated.body.traits.length, 2);
  assert.equal(updated.body.rating, 8.5);
  await api
    .delete(`/api/scouting/observations/${observation.body.id}`)
    .set(auth())
    .expect(204);
});
test("seed idempotency, viewer authorization, logout and expiration", async () => {
  await seedData(ds, "admin@nexus.gg", "IntegrationPass2026!");
  assert.equal(
    await ds.getRepository(User).countBy({ email: "admin@nexus.gg" }),
    1,
  );
  const user = await ds
    .getRepository(User)
    .findOneBy({ email: "admin@nexus.gg" });
  const viewer = await ds.getRepository(Role).findOneBy({ name: "viewer" });
  await ds.getRepository(User).update(user.id, { roleId: viewer.id });
  await api.get("/api/teams").set(auth()).expect(200);
  await api.post("/api/tasks").set(auth()).send({}).expect(403);
  await api
    .post("/api/auth/users")
    .set(auth())
    .send({
      email: "otro@nexus.gg",
      name: "Otro",
      password: "OtraPass2026!",
    })
    .expect(403);
  await api.post("/api/auth/logout").set(auth()).expect(204);
  await api.get("/api/auth/me").set(auth()).expect(401);
  const adminRole = await ds.getRepository(Role).findOneBy({ name: "admin" });
  await ds.getRepository(User).update(user.id, { roleId: adminRole.id });
  const login = await api
    .post("/api/auth/login")
    .send({ email: "admin@nexus.gg", password: "IntegrationPass2026!" })
    .expect(200);
  token = login.body.accessToken;
  await ds
    .getRepository(Session)
    .createQueryBuilder()
    .update()
    .set({ expiresAt: new Date("2020-01-01") })
    .execute();
  await api.get("/api/teams").set(auth()).expect(401);
});
