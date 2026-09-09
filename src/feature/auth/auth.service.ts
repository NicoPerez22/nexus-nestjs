import { Injectable, UnauthorizedException } from "@nestjs/common";
import { DataSource, LessThan } from "typeorm";
import { randomBytes, randomUUID } from "node:crypto";
import { User, Session } from "../../database/entities";
import { verifyPassword, tokenHash, hashPassword } from "../../common/password";
import { LoginDto } from "../../common/dtos";
@Injectable()
export class AuthService {
  private dummyHash = hashPassword(randomBytes(32).toString("hex"));
  constructor(private ds: DataSource) {}
  async login(dto: LoginDto) {
    const user = await this.ds
      .getRepository(User)
      .findOneBy({ email: dto.email.toLowerCase() });
    const valid = await verifyPassword(
      dto.password,
      user?.passwordHash || (await this.dummyHash),
    );
    if (!user || !valid)
      throw new UnauthorizedException("Credenciales incorrectas");
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(
      Date.now() + Number(process.env.SESSION_HOURS || 8) * 3600000,
    );
    await this.ds
      .getRepository(Session)
      .delete({ expiresAt: LessThan(new Date()) });
    await this.ds
      .getRepository(Session)
      .save({
        id: randomUUID(),
        userId: user.id,
        tokenHash: tokenHash(token),
        expiresAt,
      });
    return {
      accessToken: token,
      tokenType: "Bearer",
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
  async logout(sessionId: string) {
    await this.ds.getRepository(Session).delete(sessionId);
  }
}
