import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
} from "@nestjs/common";
import { ScoutingService } from "./scouting.service";
import {
  ScoutPlayerDto,
  ScoutTraitsDto,
  ScoutObservationDto,
  ScoutQuery,
} from "../../common/dtos";
@Controller("scouting")
export class ScoutingController {
  constructor(private service: ScoutingService) {}
  @Get("players") list(@Query() q: ScoutQuery) {
    return this.service.list(q);
  }
  @Post("players") create(@Body() dto: ScoutPlayerDto) {
    return this.service.create(dto);
  }
  @Get("players/:id") get(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.get(id);
  }
  @Put("players/:id") update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ScoutPlayerDto,
  ) {
    return this.service.update(id, dto);
  }
  @Delete("players/:id")
  @HttpCode(204)
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
  @Put("players/:id/traits") traits(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ScoutTraitsDto,
  ) {
    return this.service.replaceTraits(id, dto);
  }
  @Get("players/:id/observations") observations(
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.service.listObservations(id);
  }
  @Post("players/:id/observations") createObservation(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ScoutObservationDto,
  ) {
    return this.service.createObservation(id, dto);
  }
  @Put("observations/:id") updateObservation(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ScoutObservationDto,
  ) {
    return this.service.updateObservation(id, dto);
  }
  @Delete("observations/:id")
  @HttpCode(204)
  removeObservation(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.removeObservation(id);
  }
}
