import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { randomUUID } from "node:crypto";
import { Task } from "../../database/entities";
import { TaskDto, TaskQuery } from "../../common/dtos";
import { AreasService } from "../../common/areas.service";
@Injectable()
export class TasksService {
  constructor(
    private ds: DataSource,
    private areas: AreasService,
  ) {}
  async list(q: TaskQuery = {}) {
    const qb = this.ds.getRepository(Task).createQueryBuilder("x");
    if (q.team)
      qb.andWhere("x.areaId = :area", {
        area: await this.areas.resolve(q.team),
      });
    if (q.status && q.status !== "all")
      qb.andWhere("x.done = :done", { done: q.status === "completed" });
    qb.orderBy("x.due", "ASC").addOrderBy("x.id", "ASC");
    const rows = await qb.getMany();
    const areas = await this.areas.list();
    return rows.map((x) => ({
      ...x,
      team: areas.find((a) => a.id === x.areaId)!.name,
    }));
  }
  async get(id: string) {
    const row = await this.ds.getRepository(Task).findOneBy({ id });
    if (!row) throw new NotFoundException("Registro no encontrado");
    const areas = await this.areas.list();
    return { ...row, team: areas.find((a) => a.id === row.areaId)!.name };
  }
  async create(dto: TaskDto) {
    const areaId = await this.areas.resolve(dto.team);
    const id = randomUUID();
    await this.ds
      .getRepository(Task)
      .save({
        id,
        areaId,
        name: dto.name,
        who: dto.who,
        due: dto.due,
        priority: dto.priority,
        done: dto.done,
      });
    return this.get(id);
  }
  async update(id: string, dto: TaskDto) {
    await this.get(id);
    const areaId = await this.areas.resolve(dto.team);
    await this.ds
      .getRepository(Task)
      .update(id, {
        areaId,
        name: dto.name,
        who: dto.who,
        due: dto.due,
        priority: dto.priority,
        done: dto.done,
      });
    return this.get(id);
  }
  async remove(id: string) {
    const result = await this.ds.getRepository(Task).delete(id);
    if (!result.affected) throw new NotFoundException("Registro no encontrado");
  }
  async status(id: string, done: boolean) {
    await this.get(id);
    await this.ds.getRepository(Task).update(id, { done });
    return this.get(id);
  }
}
