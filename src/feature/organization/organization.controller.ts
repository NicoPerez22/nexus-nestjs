import { Controller, Get } from "@nestjs/common";
import { OrganizationService } from "./organization.service";
@Controller("organization")
export class OrganizationController {
  constructor(private service: OrganizationService) {}
  @Get() get() {
    return this.service.get();
  }
}
