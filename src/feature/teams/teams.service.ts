import { Injectable, NotFoundException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { randomUUID } from "node:crypto";
import { Team, Player } from "../../database/entities";
import { RosterDto } from "../../common/dtos";
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
}
