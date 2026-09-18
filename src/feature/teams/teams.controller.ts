import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
} from "@nestjs/common";
import { TeamsService } from "./teams.service";
import { RosterDto, TeamDto } from "../../common/dtos";
import { RosterBodyPipe } from "../../common/roster.pipe";
@Controller("teams")
export class TeamsController {
  constructor(private service: TeamsService) {}
  @Get() list() {
    return this.service.list();
  }
  @Post() create(@Body() dto: TeamDto) {
    return this.service.create(dto);
  }
  @Get(":id") get(@Param("id") id: string) {
    return this.service.get(id);
  }
  @Put(":id") update(@Param("id") id: string, @Body() dto: TeamDto) {
    return this.service.update(id, dto);
  }
  @Delete(":id") @HttpCode(204) remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
  @Get(":id/players") async players(@Param("id") id: string) {
    return (await this.service.get(id)).players;
  }
  @Put(":id/players") roster(
    @Param("id") id: string,
    @Body(RosterBodyPipe) dto: { players: RosterDto["players"] },
  ) {
    return this.service.roster(id, dto);
  }
}
