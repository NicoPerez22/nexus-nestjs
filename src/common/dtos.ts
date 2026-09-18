import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsEmail,
  MinLength,
  IsArray,
  ValidateNested,
  ArrayMaxSize,
  IsBoolean,
  IsIn,
  IsOptional,
  Matches,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsNumber,
  IsUUID,
} from "class-validator";
import { Type, Transform } from "class-transformer";
export class LoginDto {
  @IsEmail() @MaxLength(254) email: string;
  @IsString() @MinLength(1) @MaxLength(256) password: string;
}
export class CreateUserDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsEmail()
  @MaxLength(254)
  email: string;
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
  @IsString()
  @MinLength(12)
  @MaxLength(256)
  password: string;
  @IsOptional()
  @IsIn(["admin", "manager", "viewer"])
  role?: string;
}
export class PlayerDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  name: string;
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  role: string;
}
export class RosterDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => PlayerDto)
  players: PlayerDto[];
}
export class TeamDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  short: string;
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sub: string;
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  win: number;
}
export class EventDto {
  @IsOptional() @IsString() @MaxLength(36) id?: string;
  @IsOptional() @IsString() @MaxLength(36) areaId?: string;
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
  @IsString() @IsNotEmpty() @MaxLength(100) team: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) date: string;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) time: string;
  @IsIn(["Entrenamiento", "Competencia", "Reunión"]) type: string;
}
export class TaskDto {
  @IsOptional() @IsString() @MaxLength(36) id?: string;
  @IsOptional() @IsString() @MaxLength(36) areaId?: string;
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
  @IsString() @IsNotEmpty() @MaxLength(100) team: string;
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  who: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) due: string;
  @IsBoolean() priority: boolean;
  @IsBoolean() done: boolean;
}
export class TaskStatusDto {
  @IsBoolean() done: boolean;
}
export class AgendaQuery {
  @IsOptional() @IsString() @MaxLength(100) team?: string;
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  from?: string;
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  to?: string;
}
export class TaskQuery {
  @IsOptional() @IsIn(["all", "pending", "completed"]) status?: string;
  @IsOptional() @IsString() @MaxLength(100) team?: string;
}
export class SummaryQuery {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  date?: string;
}
export class FinanceCategoryDto {
  @IsOptional() @IsString() @MaxLength(36) id?: string;
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
  @IsIn(["ingreso", "egreso", "ambos"]) kind: string;
}
export class FinanceMovementDto {
  @IsOptional() @IsString() @MaxLength(36) id?: string;
  @IsIn(["ingreso", "egreso"]) kind: string;
  @IsUUID("4") categoryId: string;
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) date: string;
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  concept: string;
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  detail: string;
}
export class FinanceQuery {
  @IsOptional() @IsIn(["ingreso", "egreso"]) kind?: string;
  @IsOptional() @IsUUID("4") categoryId?: string;
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  from?: string;
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  to?: string;
}
export class FinanceChartQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(2000) @Max(2100) year?: number;
  @IsOptional() @IsIn(["ingreso", "egreso"]) kind?: string;
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  from?: string;
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  to?: string;
}
export class ScoutPlayerDto {
  @IsOptional() @IsString() @MaxLength(36) id?: string;
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  nickname: string;
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  game: string;
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  role: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(10) @Max(60) age?: number;
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(60)
  country?: string;
  @IsIn(["Seguimiento", "Contactado", "Prueba", "Fichado", "Descartado"])
  status: string;
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(200)
  contact?: string;
}
export class ScoutTraitDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name: string;
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  rating: number;
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(200)
  note?: string;
}
export class ScoutTraitsDto {
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ScoutTraitDto)
  traits: ScoutTraitDto[];
}
export class ScoutObservationDto {
  @IsOptional() @IsString() @MaxLength(36) id?: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) date: string;
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  author: string;
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}
export class ScoutQuery {
  @IsOptional() @IsString() @MaxLength(50) game?: string;
  @IsOptional()
  @IsIn(["Seguimiento", "Contactado", "Prueba", "Fichado", "Descartado"])
  status?: string;
}
