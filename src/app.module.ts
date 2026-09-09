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

@Module({
  imports: [
    TypeOrmModule.forRoot(
      {
      type: 'mysql',
      host: process.env.MYSQLHOST,
      port: Number(process.env.MYSQLPORT || 3306),
      username: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      autoLoadEntities: true,
      extra: {
        connectionLimit: 10, // máximo 10 conexiones vivas
        waitForConnections: true, // no lanzar error, poner en cola
        queueLimit: 0, // sin límite de cola
        connectTimeout: 10000, // 10 segundos
        acquireTimeout: 10000, // timeout para adquirir conexión
      },
    }
    ),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    OrganizationModule,
    AuthModule,
    TeamsModule,
    CalendarModule,
    TasksModule,
    DashboardModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
