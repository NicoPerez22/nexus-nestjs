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
import { TasksService } from "./tasks.service";
import { TaskDto, TaskQuery, TaskStatusDto } from "../../common/dtos";
import { AreasService } from "../../common/areas.service";
@Controller("tasks")
export class TasksController {
  constructor(
    private service: TasksService,
    private areas: AreasService,
  ) {}
  @Get("areas") areasList() {
    return this.areas.list();
  }
  @Get() list(@Query() query: TaskQuery) {
    return this.service.list(query);
  }
  @Get(":id") get(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.get(id);
  }
  @Post() create(@Body() dto: TaskDto) {
    return this.service.create(dto);
  }
  @Put(":id") update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: TaskDto,
  ) {
    return this.service.update(id, dto);
  }
  @Delete(":id") @HttpCode(204) remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
  @Patch(":id/status") status(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: TaskStatusDto,
  ) {
    return this.service.status(id, dto.done);
  }
}
