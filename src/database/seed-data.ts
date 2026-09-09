import { DataSource } from "typeorm";
import { randomUUID } from "node:crypto";
import {
  User,
  Team,
  Player,
  Area,
  TeamEvent,
  Task,
  Organization,
} from "./entities";
import { createSeed } from "./demo-data";
import { hashPassword } from "../common/password";
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
    if (!(await m.findOneBy(Organization, { id: 1 })))
      await m.save(Organization, {
        id: 1,
        name: "Nexus Esports",
        brand: "NEXUS HQ",
        season: 2026,
        tagline: "Todo empieza en equipo.",
        footer: "El talento gana partidas. El equipo construye el resto.",
      });
    if (!(await m.findOneBy(User, { email: email.toLowerCase() })))
      await m.save(User, {
        id: randomUUID(),
        email: email.toLowerCase(),
        name: "Admin",
        role: "manager",
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
  });
}
