import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { RosterDto } from "./dtos";

@Injectable()
export class RosterBodyPipe implements PipeTransform {
  async transform(value: unknown): Promise<RosterDto> {
    const players = Array.isArray(value)
      ? value
      : value &&
          typeof value === "object" &&
          Array.isArray((value as { players?: unknown }).players)
        ? (value as { players: unknown[] }).players
        : null;
    if (!players)
      throw new BadRequestException(
        "Se espera un array de jugadores o { players: [] }",
      );
    const dto = plainToInstance(RosterDto, { players });
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length)
      throw new BadRequestException(this.messages(errors));
    return dto;
  }
  private messages(errors: ValidationError[]): string[] {
    return errors.flatMap((error) => [
      ...Object.values(error.constraints ?? {}),
      ...this.messages(error.children ?? []),
    ]);
  }
}
