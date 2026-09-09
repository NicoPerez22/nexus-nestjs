import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { randomUUID } from "node:crypto";
import { TeamEvent } from "../../database/entities";
import { EventDto, AgendaQuery } from "../../common/dtos";
import { AreasService } from "../../common/areas.service";
@Injectable()
export class CalendarService {
  constructor(
    private ds: DataSource,
    private areas: AreasService,
  ) {}
  async list(q: AgendaQuery = {}) {
    const qb = this.ds.getRepository(TeamEvent).createQueryBuilder("x");
    if (q.team)
      qb.andWhere("x.areaId = :area", {
        area: await this.areas.resolve(q.team),
      });
    if (q.from && q.to && q.from > q.to)
      throw new BadRequestException("from debe ser anterior a to");
    if (q.from) qb.andWhere("x.date >= :from", { from: q.from });
    if (q.to) qb.andWhere("x.date <= :to", { to: q.to });
    qb.orderBy("x.date", "ASC").addOrderBy("x.time", "ASC");
    const rows = await qb.getMany();
    const areas = await this.areas.list();
    return rows.map((x) => ({
      ...x,
      time: x.time.slice(0, 5),
      team: areas.find((a) => a.id === x.areaId)!.name,
    }));
  }
  async get(id: string) {
    const row = await this.ds.getRepository(TeamEvent).findOneBy({ id });
    if (!row) throw new NotFoundException("Registro no encontrado");
    const areas = await this.areas.list();
    return {
      ...row,
      time: row.time.slice(0, 5),
      team: areas.find((a) => a.id === row.areaId)!.name,
    };
  }
  async create(dto: EventDto) {
    const areaId = await this.areas.resolve(dto.team);
    const id = randomUUID();
    await this.ds
      .getRepository(TeamEvent)
      .save({
        id,
        areaId,
        name: dto.name,
        date: dto.date,
        time: dto.time,
        type: dto.type,
      });
    return this.get(id);
  }
  async update(id: string, dto: EventDto) {
    await this.get(id);
    const areaId = await this.areas.resolve(dto.team);
    await this.ds
      .getRepository(TeamEvent)
      .update(id, {
        areaId,
        name: dto.name,
        date: dto.date,
        time: dto.time,
        type: dto.type,
      });
    return this.get(id);
  }
  async remove(id: string) {
    const result = await this.ds.getRepository(TeamEvent).delete(id);
    if (!result.affected) throw new NotFoundException("Registro no encontrado");
  }
}
