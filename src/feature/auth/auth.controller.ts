import { Controller, Post, Body, Get, Req, HttpCode } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Public } from "../../common/auth.guard";
import { LoginDto, CreateUserDto } from "../../common/dtos";
import { AuthService } from "./auth.service";
@Controller("auth")
export class AuthController {
  constructor(private service: AuthService) {}
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("login")
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }
  @Post("users")
  @HttpCode(201)
  createUser(@Body() dto: CreateUserDto) {
    return this.service.createUser(dto);
  }
  @Get("roles") roles() {
    return this.service.listRoles();
  }
  @Get("me") me(@Req() req: any) {
    return req.user;
  }
  @Post("logout") @HttpCode(204) logout(@Req() req: any) {
    return this.service.logout(req.sessionId);
  }
}
