import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
@Entity("roles")
export class Role {
  @PrimaryColumn({ type: "int" }) id: number;
  @Column({ type: "varchar", length: 30 }) name: string;
}
@Entity("users")
export class User {
  @PrimaryColumn({ type: "varchar", length: 36 }) id: string;
  @Column({ type: "varchar" }) email: string;
  @Column({ type: "varchar" }) name: string;
  @Column({ type: "int", name: "role_id" }) roleId: number;
  @ManyToOne(() => Role, { eager: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "role_id" })
  role: Role;
  @Column({ type: "text", name: "password_hash" }) passwordHash: string;
}
@Entity("sessions")
export class Session {
  @PrimaryColumn({ type: "varchar", length: 36 }) id: string;
  @Column({ type: "varchar", name: "token_hash" }) tokenHash: string;
  @Column({ type: "varchar", length: 36, name: "user_id" }) userId: string;
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
  @PrimaryColumn({ type: "varchar", length: 36 }) id: string;
  @Column({ type: "varchar" }) name: string;
  @Column({ type: "varchar", name: "team_id", nullable: true }) teamId:
    | string
    | null;
}
@Entity("players")
export class Player {
  @PrimaryColumn({ type: "varchar", length: 36 }) id: string;
  @Column({ type: "varchar", name: "team_id" }) teamId: string;
  @Column({ type: "varchar" }) name: string;
  @Column({ type: "varchar" }) role: string;
  @Column({ type: "integer" }) position: number;
}
@Entity("events")
export class TeamEvent {
  @PrimaryColumn({ type: "varchar", length: 36 }) id: string;
  @Column({ type: "varchar" }) name: string;
  @Column({ type: "varchar", length: 36, name: "area_id" }) areaId: string;
  @Column({ type: "date" }) date: string;
  @Column({ type: "time" }) time: string;
  @Column({ type: "varchar" }) type: string;
}
@Entity("tasks")
export class Task {
  @PrimaryColumn({ type: "varchar", length: 36 }) id: string;
  @Column({ type: "varchar" }) name: string;
  @Column({ type: "varchar", length: 36, name: "area_id" }) areaId: string;
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
@Entity("finance_categories")
export class FinanceCategory {
  @PrimaryColumn({ type: "varchar", length: 36 }) id: string;
  @Column({ type: "varchar" }) name: string;
  @Column({ type: "varchar" }) kind: string;
}
@Entity("finance_movements")
export class FinanceMovement {
  @PrimaryColumn({ type: "varchar", length: 36 }) id: string;
  @Column({ type: "varchar" }) kind: string;
  @Column({ type: "varchar", length: 36, name: "category_id" }) categoryId: string;
  @Column({ type: "decimal", precision: 12, scale: 2 }) amount: string;
  @Column({ type: "date" }) date: string;
  @Column({ type: "varchar" }) concept: string;
  @Column({ type: "varchar" }) detail: string;
}
@Entity("scout_players")
export class ScoutPlayer {
  @PrimaryColumn({ type: "varchar", length: 36 }) id: string;
  @Column({ type: "varchar" }) name: string;
  @Column({ type: "varchar" }) nickname: string;
  @Column({ type: "varchar" }) game: string;
  @Column({ type: "varchar" }) role: string;
  @Column({ type: "integer", nullable: true }) age: number | null;
  @Column({ type: "varchar", nullable: true }) country: string | null;
  @Column({ type: "varchar" }) status: string;
  @Column({ type: "varchar", nullable: true }) contact: string | null;
}
@Entity("scout_traits")
export class ScoutTrait {
  @PrimaryColumn({ type: "varchar", length: 36 }) id: string;
  @Column({ type: "varchar", length: 36, name: "player_id" }) playerId: string;
  @Column({ type: "varchar" }) name: string;
  @Column({ type: "integer" }) rating: number;
  @Column({ type: "varchar", nullable: true }) note: string | null;
}
@Entity("scout_observations")
export class ScoutObservation {
  @PrimaryColumn({ type: "varchar", length: 36 }) id: string;
  @Column({ type: "varchar", length: 36, name: "player_id" }) playerId: string;
  @Column({ type: "date" }) date: string;
  @Column({ type: "varchar" }) author: string;
  @Column({ type: "varchar" }) title: string;
  @Column({ type: "varchar", length: 2000 }) content: string;
}
export const entities = [
  Role,
  User,
  Session,
  Team,
  Area,
  Player,
  TeamEvent,
  Task,
  Organization,
  FinanceCategory,
  FinanceMovement,
  ScoutPlayer,
  ScoutTrait,
  ScoutObservation,
];
