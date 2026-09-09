import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { QueryFailedError } from "typeorm";
@Catch(QueryFailedError)
export class DbErrorFilter implements ExceptionFilter {
  catch(error: QueryFailedError, host: ArgumentsHost) {
    const code = (error.driverError as { code?: string }).code;
    const status =
      code === "23505"
        ? 409
        : code === "23503" ||
            code === "23514" ||
            code === "22007" ||
            code === "22008"
          ? 400
          : 500;
    host
      .switchToHttp()
      .getResponse()
      .status(status)
      .json({
        statusCode: status,
        message:
          status === 409
            ? "El registro ya existe"
            : status === 400
              ? "Datos o referencia inválidos"
              : "No se pudo completar la operación",
      });
  }
}
