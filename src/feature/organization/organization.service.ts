import { Injectable, NotFoundException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { Organization } from "../../database/entities";
@Injectable()
export class OrganizationService {
  constructor(private ds: DataSource) {}
  async get() {
    const value = await this.ds
      .getRepository(Organization)
      .findOneBy({ id: 1 });
    if (!value) throw new NotFoundException("Ejecutá el seed de organización");
    return value;
  }
}
