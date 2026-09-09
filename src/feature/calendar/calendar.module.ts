import { Module } from "@nestjs/common";
import { CalendarController } from "./calendar.controller";
import { CalendarService } from "./calendar.service";
import { AreasService } from "../../common/areas.service";
@Module({
  imports: [],
  controllers: [CalendarController],
  providers: [CalendarService, AreasService],
  exports: [CalendarService],
})
export class CalendarModule {}
