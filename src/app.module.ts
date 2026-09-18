import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { AuthGuard } from "./common/auth.guard";
import { AuthModule } from "./feature/auth/auth.module";
import { TeamsModule } from "./feature/teams/teams.module";
import { CalendarModule } from "./feature/calendar/calendar.module";
import { TasksModule } from "./feature/tasks/tasks.module";
import { DashboardModule } from "./feature/dashboard/dashboard.module";
import { OrganizationModule } from "./feature/organization/organization.module";
import { FinanceModule } from "./feature/finance/finance.module";
import { ScoutingModule } from "./feature/scouting/scouting.module";
import { databaseOptions } from "./database/data-source";

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseOptions),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    OrganizationModule,
    AuthModule,
    TeamsModule,
    CalendarModule,
    TasksModule,
    DashboardModule,
    FinanceModule,
    ScoutingModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
