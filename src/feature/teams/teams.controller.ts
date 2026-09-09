import { Controller, Get, Put, Param, Body } from "@nestjs/common";
import { TeamsService } from "./teams.service";
import { RosterDto } from "../../common/dtos";
@Controller("teams")
export class TeamsController {
  constructor(private service: TeamsService) {}
  @Get() list() {
    return this.service.list();
  }
  @Get(":id") get(@Param("id") id: string) {
    return this.service.get(id);
  }
  @Get(":id/players") async players(@Param("id") id: string) {
    return (await this.service.get(id)).players;
  }
  @Put(":id/players") roster(@Param("id") id: string, @Body() dto: RosterDto) {
    return this.service.roster(id, dto);
  }
}
