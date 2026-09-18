import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
} from "@nestjs/common";
import { FinanceService } from "./finance.service";
import {
  FinanceCategoryDto,
  FinanceMovementDto,
  FinanceQuery,
  FinanceChartQuery,
} from "../../common/dtos";
@Controller("finance")
export class FinanceController {
  constructor(private service: FinanceService) {}
  @Get("categories") categories() {
    return this.service.categories();
  }
  @Post("categories") createCategory(@Body() dto: FinanceCategoryDto) {
    return this.service.createCategory(dto);
  }
  @Put("categories/:id") updateCategory(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: FinanceCategoryDto,
  ) {
    return this.service.updateCategory(id, dto);
  }
  @Delete("categories/:id")
  @HttpCode(204)
  removeCategory(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.removeCategory(id);
  }
  @Get("summary") summary(@Query() q: FinanceQuery) {
    return this.service.summary(q);
  }
  @Get("charts/monthly") chartMonthly(@Query() q: FinanceChartQuery) {
    return this.service.chartMonthly(q);
  }
  @Get("charts/categories") chartCategories(@Query() q: FinanceChartQuery) {
    return this.service.chartCategories(q);
  }
  @Get("movements") list(@Query() q: FinanceQuery) {
    return this.service.list(q);
  }
  @Post("movements") create(@Body() dto: FinanceMovementDto) {
    return this.service.create(dto);
  }
  @Get("movements/:id") get(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.get(id);
  }
  @Put("movements/:id") update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: FinanceMovementDto,
  ) {
    return this.service.update(id, dto);
  }
  @Delete("movements/:id")
  @HttpCode(204)
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
