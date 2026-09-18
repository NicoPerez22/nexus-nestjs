import { Injectable, NotFoundException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { randomUUID } from "node:crypto";
import {
  ScoutPlayer,
  ScoutTrait,
  ScoutObservation,
} from "../../database/entities";
import {
  ScoutPlayerDto,
  ScoutTraitsDto,
  ScoutObservationDto,
  ScoutQuery,
} from "../../common/dtos";

const avg = (ratings: number[]) =>
  ratings.length
    ? Math.round((ratings.reduce((n, r) => n + r, 0) / ratings.length) * 10) / 10
    : null;

@Injectable()
export class ScoutingService {
  constructor(private ds: DataSource) {}
  async list(q: ScoutQuery = {}) {
    const qb = this.ds.getRepository(ScoutPlayer).createQueryBuilder("x");
    if (q.game) qb.andWhere("x.game = :game", { game: q.game });
    if (q.status) qb.andWhere("x.status = :status", { status: q.status });
    qb.orderBy("x.name", "ASC");
    const players = await qb.getMany();
    const traits = await this.ds.getRepository(ScoutTrait).find();
    const observations = await this.ds.getRepository(ScoutObservation).find();
    return players.map((player) => {
      const playerTraits = traits.filter((t) => t.playerId === player.id);
      return {
        ...player,
        traitsCount: playerTraits.length,
        observationsCount: observations.filter((o) => o.playerId === player.id)
          .length,
        rating: avg(playerTraits.map((t) => t.rating)),
      };
    });
  }
  async get(id: string) {
    const player = await this.ds.getRepository(ScoutPlayer).findOneBy({ id });
    if (!player) throw new NotFoundException("Jugador no encontrado");
    const traits = await this.ds
      .getRepository(ScoutTrait)
      .find({ where: { playerId: id }, order: { name: "ASC" } });
    const observations = await this.ds.getRepository(ScoutObservation).find({
      where: { playerId: id },
      order: { date: "DESC" },
    });
    return {
      ...player,
      rating: avg(traits.map((t) => t.rating)),
      traits,
      observations,
    };
  }
  async create(dto: ScoutPlayerDto) {
    const id = randomUUID();
    await this.ds.getRepository(ScoutPlayer).save(this.fields(id, dto));
    return this.get(id);
  }
  async update(id: string, dto: ScoutPlayerDto) {
    await this.ensurePlayer(id);
    await this.ds.getRepository(ScoutPlayer).update(id, this.fields(id, dto));
    return this.get(id);
  }
  async remove(id: string) {
    await this.ds.transaction(async (m) => {
      const player = await m.findOneBy(ScoutPlayer, { id });
      if (!player) throw new NotFoundException("Jugador no encontrado");
      await m.delete(ScoutObservation, { playerId: id });
      await m.delete(ScoutTrait, { playerId: id });
      await m.delete(ScoutPlayer, { id });
    });
  }
  async replaceTraits(id: string, dto: ScoutTraitsDto) {
    await this.ensurePlayer(id);
    await this.ds.transaction(async (m) => {
      await m.delete(ScoutTrait, { playerId: id });
      if (dto.traits.length)
        await m.save(
          ScoutTrait,
          dto.traits.map((trait) => ({
            id: randomUUID(),
            playerId: id,
            name: trait.name,
            rating: trait.rating,
            note: trait.note ?? null,
          })),
        );
    });
    return this.get(id);
  }
  async listObservations(playerId: string) {
    await this.ensurePlayer(playerId);
    return this.ds.getRepository(ScoutObservation).find({
      where: { playerId },
      order: { date: "DESC" },
    });
  }
  async createObservation(playerId: string, dto: ScoutObservationDto) {
    await this.ensurePlayer(playerId);
    const id = randomUUID();
    await this.ds.getRepository(ScoutObservation).save({
      id,
      playerId,
      date: dto.date,
      author: dto.author,
      title: dto.title,
      content: dto.content,
    });
    return this.getObservation(id);
  }
  async getObservation(id: string) {
    const row = await this.ds.getRepository(ScoutObservation).findOneBy({ id });
    if (!row) throw new NotFoundException("Observación no encontrada");
    return row;
  }
  async updateObservation(id: string, dto: ScoutObservationDto) {
    const row = await this.getObservation(id);
    await this.ds.getRepository(ScoutObservation).update(id, {
      date: dto.date,
      author: dto.author,
      title: dto.title,
      content: dto.content,
    });
    return this.getObservation(row.id);
  }
  async removeObservation(id: string) {
    const result = await this.ds.getRepository(ScoutObservation).delete(id);
    if (!result.affected)
      throw new NotFoundException("Observación no encontrada");
  }
  private async ensurePlayer(id: string) {
    const player = await this.ds.getRepository(ScoutPlayer).findOneBy({ id });
    if (!player) throw new NotFoundException("Jugador no encontrado");
    return player;
  }
  private fields(id: string, dto: ScoutPlayerDto) {
    return {
      id,
      name: dto.name,
      nickname: dto.nickname,
      game: dto.game,
      role: dto.role,
      age: dto.age ?? null,
      country: dto.country || null,
      status: dto.status,
      contact: dto.contact || null,
    };
  }
}
