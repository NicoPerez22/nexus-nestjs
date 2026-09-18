import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { DataSource, LessThan } from "typeorm";
import { randomBytes, randomUUID } from "node:crypto";
import { User, Session, Role } from "../../database/entities";
import { verifyPassword, tokenHash, hashPassword } from "../../common/password";
import { LoginDto, CreateUserDto } from "../../common/dtos";
import { publicUser } from "../../common/user";
@Injectable()
export class AuthService {
  private dummyHash = hashPassword(randomBytes(32).toString("hex"));
  constructor(private ds: DataSource) {}
  async login(dto: LoginDto) {
    const user = await this.ds
      .getRepository(User)
      .findOne({
        where: { email: dto.email.toLowerCase() },
        relations: { role: true },
      });
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
      user: publicUser(user),
    };
  }
  async logout(sessionId: string) {
    await this.ds.getRepository(Session).delete(sessionId);
  }
  async listRoles() {
    return this.ds.getRepository(Role).find({ order: { id: "ASC" } });
  }
  async createUser(dto: CreateUserDto) {
    const email = dto.email.toLowerCase();
    const existing = await this.ds.getRepository(User).findOneBy({ email });
    if (existing) throw new ConflictException("El correo ya está registrado");
    const role = await this.ds
      .getRepository(Role)
      .findOneBy({ name: dto.role ?? "viewer" });
    if (!role) throw new BadRequestException("Rol inexistente");
    const user = this.ds.getRepository(User).create({
      id: randomUUID(),
      email,
      name: dto.name,
      roleId: role.id,
      role,
      passwordHash: await hashPassword(dto.password),
    });
    await this.ds.getRepository(User).save(user);
    return publicUser(user);
  }
}
