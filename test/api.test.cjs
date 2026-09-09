const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { newDb, DataType } = require("pg-mem");
const { Test } = require("@nestjs/testing");
const { DataSource } = require("typeorm");
const request = require("supertest");
const { AppModule } = require("../dist/app.module");
const { entities, User, Session } = require("../dist/database/entities");
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
  const org = await api.get("/api/organization").set(auth()).expect(200);
  assert.equal(org.body.name, "Nexus Esports");
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
  const stats = await api.get("/api/dashboard/stats").set(auth()).expect(200);
  assert.equal(stats.body.players, 11);
  await api
    .put("/api/teams/valorant/players")
    .set(auth())
    .send({ players: [{ name: " ", role: "IGL" }] })
    .expect(400);
  assert.equal(
    (await api.get("/api/teams/valorant/players").set(auth())).body.length,
    1,
  );
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
    .send(payload)
    .expect(201);
  const id = created.body.id;
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
test("seed idempotency, viewer authorization, logout and expiration", async () => {
  await seedData(ds, "admin@nexus.gg", "IntegrationPass2026!");
  assert.equal(await ds.getRepository(User).count(), 1);
  const user = await ds
    .getRepository(User)
    .findOneBy({ email: "admin@nexus.gg" });
  await ds.getRepository(User).update(user.id, { role: "viewer" });
  await api.get("/api/teams").set(auth()).expect(200);
  await api.post("/api/tasks").set(auth()).send({}).expect(403);
  await api.post("/api/auth/logout").set(auth()).expect(204);
  await api.get("/api/auth/me").set(auth()).expect(401);
  await ds.getRepository(User).update(user.id, { role: "manager" });
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
