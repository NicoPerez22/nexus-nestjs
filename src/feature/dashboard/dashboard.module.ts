import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { TeamsModule } from "../teams/teams.module";
import { CalendarModule } from "../calendar/calendar.module";
import { TasksModule } from "../tasks/tasks.module";
@Module({
  imports: [TeamsModule, CalendarModule, TasksModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
