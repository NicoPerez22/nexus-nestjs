import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { randomUUID } from "node:crypto";
import { Team, Player, Area, TeamEvent, Task } from "../../database/entities";
import { RosterDto, TeamDto } from "../../common/dtos";
@Injectable()
export class TeamsService {
  constructor(private ds: DataSource) {}
  async list() {
    const teams = await this.ds
      .getRepository(Team)
      .find({ order: { name: "ASC" } });
    const players = await this.ds
      .getRepository(Player)
      .find({ order: { position: "ASC" } });
    return teams.map((t) => ({
      ...t,
      players: players
        .filter((p) => p.teamId === t.id)
        .map((p) => ({ id: p.id, name: p.name, role: p.role })),
    }));
  }
  async get(id: string) {
    const team = (await this.list()).find((t) => t.id === id);
    if (!team) throw new NotFoundException("Equipo no encontrado");
    return team;
  }
  async create(dto: TeamDto) {
    await this.assertUniqueName(dto.name);
    const id = await this.uniqueId(this.slug(dto.name));
    await this.ds.transaction(async (m) => {
      await m.save(Team, {
        id,
        name: dto.name,
        short: dto.short,
        sub: dto.sub,
        win: dto.win,
      });
      await m.save(Area, { id: randomUUID(), name: dto.name, teamId: id });
    });
    return this.get(id);
  }
  async update(id: string, dto: TeamDto) {
    await this.ds.transaction(async (m) => {
      const team = await m
        .getRepository(Team)
        .findOne({ where: { id }, lock: { mode: "pessimistic_write" } });
      if (!team) throw new NotFoundException("Equipo no encontrado");
      if (dto.name !== team.name) await this.assertUniqueName(dto.name, m);
      await m.update(Team, id, {
        name: dto.name,
        short: dto.short,
        sub: dto.sub,
        win: dto.win,
      });
      const area = await m.findOneBy(Area, { teamId: id });
      if (area && area.name !== dto.name)
        await m.update(Area, area.id, { name: dto.name });
    });
    return this.get(id);
  }
  async remove(id: string) {
    await this.ds.transaction(async (m) => {
      const team = await m
        .getRepository(Team)
        .findOne({ where: { id }, lock: { mode: "pessimistic_write" } });
      if (!team) throw new NotFoundException("Equipo no encontrado");
      const area = await m.findOneBy(Area, { teamId: id });
      if (area) {
        await m.delete(TeamEvent, { areaId: area.id });
        await m.delete(Task, { areaId: area.id });
        await m.delete(Area, { id: area.id });
      }
      await m.delete(Player, { teamId: id });
      await m.delete(Team, { id });
    });
  }
  async roster(id: string, dto: RosterDto) {
    await this.ds.transaction(async (m) => {
      const team = await m
        .getRepository(Team)
        .findOne({ where: { id }, lock: { mode: "pessimistic_write" } });
      if (!team) throw new NotFoundException("Equipo no encontrado");
      await m.delete(Player, { teamId: id });
      if (dto.players.length)
        await m.save(
          Player,
          dto.players.map((p, position) => ({
            ...p,
            id: randomUUID(),
            teamId: id,
            position,
          })),
        );
    });
    return this.get(id);
  }
  private slug(name: string) {
    const slug = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50);
    return slug || `team-${randomUUID().slice(0, 8)}`;
  }
  private async uniqueId(base: string) {
    const teams = this.ds.getRepository(Team);
    if (!(await teams.findOneBy({ id: base }))) return base;
    const prefix = base.slice(0, 46);
    for (let n = 2; n < 1000; n++) {
      const id = `${prefix}-${n}`;
      if (!(await teams.findOneBy({ id }))) return id;
    }
    return `${prefix}-${randomUUID().slice(0, 8)}`;
  }
  private async assertUniqueName(name: string, m = this.ds.manager) {
    if (await m.findOneBy(Team, { name }))
      throw new ConflictException("El equipo ya existe");
    if (await m.findOneBy(Area, { name }))
      throw new ConflictException("Ya existe un área con ese nombre");
  }
}
