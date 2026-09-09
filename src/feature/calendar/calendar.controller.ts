import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
} from "@nestjs/common";
import { CalendarService } from "./calendar.service";
import { EventDto, AgendaQuery, TaskStatusDto } from "../../common/dtos";
import { AreasService } from "../../common/areas.service";
@Controller("calendar/events")
export class CalendarController {
  constructor(
    private service: CalendarService,
    private areas: AreasService,
  ) {}
  @Get("areas") areasList() {
    return this.areas.list();
  }
  @Get() list(@Query() query: AgendaQuery) {
    return this.service.list(query);
  }
  @Get(":id") get(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.get(id);
  }
  @Post() create(@Body() dto: EventDto) {
    return this.service.create(dto);
  }
  @Put(":id") update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: EventDto,
  ) {
    return this.service.update(id, dto);
  }
  @Delete(":id") @HttpCode(204) remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
