import { Entity, PrimaryColumn, Column } from "typeorm";
@Entity("users")
export class User {
  @PrimaryColumn({ type: "uuid" }) id: string;
  @Column({ type: "varchar" }) email: string;
  @Column({ type: "varchar" }) name: string;
  @Column({ type: "varchar" }) role: string;
  @Column({ type: "text", name: "password_hash" }) passwordHash: string;
}
@Entity("sessions")
export class Session {
  @PrimaryColumn({ type: "uuid" }) id: string;
  @Column({ type: "varchar", name: "token_hash" }) tokenHash: string;
  @Column({ type: "uuid", name: "user_id" }) userId: string;
  @Column({ type: "timestamp", name: "expires_at" }) expiresAt: Date;
}
@Entity("teams")
export class Team {
  @PrimaryColumn({ type: "varchar" }) id: string;
  @Column({ type: "varchar" }) name: string;
  @Column({ type: "varchar" }) short: string;
  @Column({ type: "varchar" }) sub: string;
  @Column({ type: "integer" }) win: number;
}
@Entity("areas")
export class Area {
  @PrimaryColumn({ type: "uuid" }) id: string;
  @Column({ type: "varchar" }) name: string;
  @Column({ type: "varchar", name: "team_id", nullable: true }) teamId:
    | string
    | null;
}
@Entity("players")
export class Player {
  @PrimaryColumn({ type: "uuid" }) id: string;
  @Column({ type: "varchar", name: "team_id" }) teamId: string;
  @Column({ type: "varchar" }) name: string;
  @Column({ type: "varchar" }) role: string;
  @Column({ type: "integer" }) position: number;
}
@Entity("events")
export class TeamEvent {
  @PrimaryColumn({ type: "uuid" }) id: string;
  @Column({ type: "varchar" }) name: string;
  @Column({ type: "uuid", name: "area_id" }) areaId: string;
  @Column({ type: "date" }) date: string;
  @Column({ type: "time" }) time: string;
  @Column({ type: "varchar" }) type: string;
}
@Entity("tasks")
export class Task {
  @PrimaryColumn({ type: "uuid" }) id: string;
  @Column({ type: "varchar" }) name: string;
  @Column({ type: "uuid", name: "area_id" }) areaId: string;
  @Column({ type: "varchar" }) who: string;
  @Column({ type: "date" }) due: string;
  @Column({ type: "boolean" }) priority: boolean;
  @Column({ type: "boolean" }) done: boolean;
}
@Entity("organization")
export class Organization {
  @PrimaryColumn({ type: "integer" }) id: number;
  @Column({ type: "varchar" }) name: string;
  @Column({ type: "varchar" }) brand: string;
  @Column({ type: "integer" }) season: number;
  @Column({ type: "varchar" }) tagline: string;
  @Column({ type: "varchar" }) footer: string;
}
export const entities = [
  User,
  Session,
  Team,
  Area,
  Player,
  TeamEvent,
  Task,
  Organization,
];
