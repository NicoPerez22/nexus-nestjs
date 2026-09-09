import { Module } from "@nestjs/common";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";
import { AreasService } from "../../common/areas.service";
@Module({
  imports: [],
  controllers: [TasksController],
  providers: [TasksService, AreasService],
  exports: [TasksService],
})
export class TasksModule {}
