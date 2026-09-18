import { Module } from "@nestjs/common";
import { ScoutingController } from "./scouting.controller";
import { ScoutingService } from "./scouting.service";
@Module({
  imports: [],
  controllers: [ScoutingController],
  providers: [ScoutingService],
  exports: [ScoutingService],
})
export class ScoutingModule {}
