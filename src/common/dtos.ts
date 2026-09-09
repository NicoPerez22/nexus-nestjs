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
} from "class-validator";
import { Type, Transform } from "class-transformer";
export class LoginDto {
  @IsEmail() @MaxLength(254) email: string;
  @IsString() @MinLength(1) @MaxLength(256) password: string;
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
export class EventDto {
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
