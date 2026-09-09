import { Controller, Get, Query } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { SummaryQuery } from "../../common/dtos";
@Controller("dashboard")
export class DashboardController {
  constructor(private service: DashboardService) {}
  @Get() summary(@Query() q: SummaryQuery) {
    return this.service.summary(q.date);
  }
  @Get("stats") async stats(@Query() q: SummaryQuery) {
    return (await this.service.summary(q.date)).stats;
  }
}
