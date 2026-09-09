import { Injectable, BadRequestException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { Area } from "../database/entities";
@Injectable()
export class AreasService {
  constructor(private ds: DataSource) {}
  list() {
    return this.ds.getRepository(Area).find({ order: { name: "ASC" } });
  }
  async resolve(name: string) {
    const area = await this.ds.getRepository(Area).findOneBy({ name });
    if (!area) throw new BadRequestException("Equipo o área inexistente");
    return area.id;
  }
}
