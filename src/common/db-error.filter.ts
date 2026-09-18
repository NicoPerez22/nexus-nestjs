import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { QueryFailedError } from "typeorm";
@Catch(QueryFailedError)
export class DbErrorFilter implements ExceptionFilter {
  catch(error: QueryFailedError, host: ArgumentsHost) {
    const code = (error.driverError as { code?: string }).code;
    const conflict = ["23505", "ER_DUP_ENTRY"];
    const badRequest = [
      "23503",
      "23514",
      "22007",
      "22008",
      "ER_NO_REFERENCED_ROW",
      "ER_NO_REFERENCED_ROW_2",
      "ER_ROW_IS_REFERENCED",
      "ER_ROW_IS_REFERENCED_2",
      "ER_CHECK_CONSTRAINT_VIOLATED",
      "ER_BAD_NULL_ERROR",
      "ER_DATA_TOO_LONG",
      "ER_TRUNCATED_WRONG_VALUE",
      "WARN_DATA_TRUNCATED",
    ];
    let status = 500;
    if (conflict.includes(code ?? "")) status = 409;
    else if (badRequest.includes(code ?? "")) status = 400;
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
