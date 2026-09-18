import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { DataSource, MoreThan } from "typeorm";
import { Session, User } from "../database/entities";
import { tokenHash } from "./password";
import { canMutate, publicUser } from "./user";
export const Public = () => SetMetadata("public", true);
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private ds: DataSource,
    private reflector: Reflector,
  ) {}
  async canActivate(ctx: ExecutionContext) {
    if (
      this.reflector.getAllAndOverride("public", [
        ctx.getHandler(),
        ctx.getClass(),
      ])
    )
      return true;
    const req = ctx.switchToHttp().getRequest();
    const header = req.headers.authorization;
    if (typeof header !== "string" || !/^Bearer [a-f0-9]{64}$/.test(header))
      throw new UnauthorizedException();
    const session = await this.ds
      .getRepository(Session)
      .findOneBy({
        tokenHash: tokenHash(header.slice(7)),
        expiresAt: MoreThan(new Date()),
      });
    if (!session) throw new UnauthorizedException("Sesión inválida o vencida");
    const user = await this.ds
      .getRepository(User)
      .findOne({
        where: { id: session.userId },
        relations: { role: true },
      });
    if (!user) throw new UnauthorizedException();
    req.user = publicUser(user);
    req.sessionId = session.id;
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      !canMutate(user.role?.name) &&
      req.path !== "/api/auth/logout"
    )
      throw new ForbiddenException("Se requiere rol admin o manager");
    return true;
  }
}
