import { Injectable } from "@nestjs/common";
import { TeamsService } from "../teams/teams.service";
import { CalendarService } from "../calendar/calendar.service";
import { TasksService } from "../tasks/tasks.service";
@Injectable()
export class DashboardService {
  constructor(
    private teams: TeamsService,
    private calendar: CalendarService,
    private tasks: TasksService,
  ) {}
  async summary(date?: string) {
    const today =
      date ||
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Argentina/Buenos_Aires",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
    const [teams, events, tasks] = await Promise.all([
      this.teams.list(),
      this.calendar.list(),
      this.tasks.list(),
    ]);
    const pending = tasks.filter((t) => !t.done);
    return {
      date: today,
      stats: {
        activeTeams: teams.length,
        players: teams.reduce((n, t) => n + t.players.length, 0),
        winRate: Math.round(
          teams.reduce((n, t) => n + t.win, 0) / (teams.length || 1),
        ),
        pendingTasks: pending.length,
        dueToday: pending.filter((t) => t.due <= today).length,
      },
      todayEvents: events.filter((e) => e.date === today),
      nextCompetition:
        events.find((e) => e.type === "Competencia" && e.date >= today) || null,
      teams,
      pendingTasks: pending.slice(0, 4),
    };
  }
}
