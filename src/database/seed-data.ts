import { DataSource } from "typeorm";
import { randomUUID } from "node:crypto";
import {
  Role,
  User,
  Team,
  Player,
  Area,
  TeamEvent,
  Task,
  Organization,
  FinanceCategory,
  FinanceMovement,
  ScoutPlayer,
  ScoutTrait,
  ScoutObservation,
} from "./entities";
import { createSeed } from "./demo-data";
import { hashPassword } from "../common/password";
const defaultRoles = [
  { id: 1, name: "admin" },
  { id: 2, name: "manager" },
  { id: 3, name: "viewer" },
];
export async function seedData(
  ds: DataSource,
  email: string,
  password: string,
) {
  if (password.length < 12)
    throw new Error("Seed password must have at least 12 characters");
  const hash = await hashPassword(password);
  const demo = createSeed();
  await ds.transaction(async (m) => {
    for (const role of defaultRoles)
      if (!(await m.findOneBy(Role, { name: role.name })))
        await m.save(Role, role);
    if (!(await m.findOneBy(Organization, { id: 1 })))
      await m.save(Organization, {
        id: 1,
        name: "Nexus Esports",
        brand: "NEXUS HQ",
        season: 2026,
        tagline: "Todo empieza en equipo.",
        footer: "El talento gana partidas. El equipo construye el resto.",
      });
    const adminRole = await m.findOneBy(Role, { name: "admin" });
    if (
      adminRole &&
      !(await m.findOneBy(User, { email: email.toLowerCase() }))
    )
      await m.save(User, {
        id: randomUUID(),
        email: email.toLowerCase(),
        name: "Admin",
        roleId: adminRole.id,
        passwordHash: hash,
      });
    for (const t of demo.teams) {
      if (!(await m.findOneBy(Team, { id: t.id }))) {
        await m.save(Team, {
          id: t.id,
          name: t.name,
          short: t.short,
          sub: t.sub,
          win: t.win,
        });
        await m.save(Area, { id: randomUUID(), name: t.name, teamId: t.id });
        for (const [position, p] of t.players.entries())
          await m.save(Player, {
            id: randomUUID(),
            teamId: t.id,
            ...p,
            position,
          });
      }
    }
    for (const name of ["Organización", "Staff técnico", "Contenido"])
      if (!(await m.findOneBy(Area, { name })))
        await m.save(Area, { id: randomUUID(), name, teamId: null });
    const areas = await m.find(Area);
    const areaId = (name: string) => areas.find((a) => a.name === name)!.id;
    // Stable UUIDs make re-running the seed idempotent without duplicating records.
    for (const [i, e] of demo.events.entries()) {
      const id = `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`;
      if (!(await m.findOneBy(TeamEvent, { id })))
        await m.save(TeamEvent, {
          id,
          name: e.name,
          areaId: areaId(e.team),
          date: e.date,
          time: e.time,
          type: e.type,
        });
    }
    for (const [i, t] of demo.tasks.entries()) {
      const id = `00000000-0000-4000-9000-${String(i + 1).padStart(12, "0")}`;
      if (!(await m.findOneBy(Task, { id })))
        await m.save(Task, {
          id,
          name: t.name,
          areaId: areaId(t.team),
          who: t.who,
          due: t.due,
          priority: t.priority,
          done: t.done,
        });
    }
    const categories = [
      { id: "00000000-0000-4000-a000-000000000001", name: "Sponsors", kind: "ingreso" },
      { id: "00000000-0000-4000-a000-000000000002", name: "Premios", kind: "ingreso" },
      { id: "00000000-0000-4000-a000-000000000003", name: "Merchandising", kind: "ambos" },
      { id: "00000000-0000-4000-a000-000000000004", name: "Viajes", kind: "egreso" },
      { id: "00000000-0000-4000-a000-000000000005", name: "Equipamiento", kind: "egreso" },
      { id: "00000000-0000-4000-a000-000000000006", name: "Sueldos", kind: "egreso" },
    ];
    for (const category of categories)
      if (!(await m.findOneBy(FinanceCategory, { id: category.id })))
        await m.save(FinanceCategory, category);
    const travel = categories[3].id;
    const today = demo.events[0].date;
    const movements = [
      {
        id: "00000000-0000-4000-c000-000000000001",
        kind: "ingreso",
        categoryId: categories[0].id,
        amount: "250000.00",
        date: today,
        concept: "Sponsor principal",
        detail: "Cuota mensual del sponsor de camiseta",
      },
      {
        id: "00000000-0000-4000-c000-000000000002",
        kind: "egreso",
        categoryId: travel,
        amount: "85000.00",
        date: today,
        concept: "Viaje a LAN",
        detail: "Pasajes y hotel del roster Valorant",
      },
    ];
    for (const movement of movements)
      if (!(await m.findOneBy(FinanceMovement, { id: movement.id })))
        await m.save(FinanceMovement, movement);
    const scoutId = "00000000-0000-4000-b000-000000000001";
    if (!(await m.findOneBy(ScoutPlayer, { id: scoutId }))) {
      await m.save(ScoutPlayer, {
        id: scoutId,
        name: "Martín Pérez",
        nickname: "volt",
        game: "Valorant",
        role: "Duelista",
        age: 19,
        country: "Argentina",
        status: "Seguimiento",
        contact: "volt#LAN",
      });
      await m.save(ScoutTrait, [
        {
          id: "00000000-0000-4000-b100-000000000001",
          playerId: scoutId,
          name: "Aim",
          rating: 8,
          note: "Consistente en ranked",
        },
        {
          id: "00000000-0000-4000-b100-000000000002",
          playerId: scoutId,
          name: "Comunicación",
          rating: 6,
          note: null,
        },
      ]);
      await m.save(ScoutObservation, {
        id: "00000000-0000-4000-b200-000000000001",
        playerId: scoutId,
        date: today,
        author: "Coach",
        title: "Primer VOD",
        content: "Buen entry, le cuesta el post-plant. Seguir de cerca.",
      });
    }
  });
}
