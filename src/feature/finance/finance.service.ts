import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { randomUUID } from "node:crypto";
import { FinanceCategory, FinanceMovement } from "../../database/entities";
import {
  FinanceCategoryDto,
  FinanceMovementDto,
  FinanceQuery,
  FinanceChartQuery,
} from "../../common/dtos";

const money = (n: number | string) => Math.round(Number(n) * 100) / 100;

@Injectable()
export class FinanceService {
  constructor(private ds: DataSource) {}
  categories() {
    return this.ds
      .getRepository(FinanceCategory)
      .find({ order: { name: "ASC" } });
  }
  async createCategory(dto: FinanceCategoryDto) {
    if (await this.ds.getRepository(FinanceCategory).findOneBy({ name: dto.name }))
      throw new ConflictException("La categoría ya existe");
    const id = randomUUID();
    await this.ds
      .getRepository(FinanceCategory)
      .save({ id, name: dto.name, kind: dto.kind });
    return this.getCategory(id);
  }
  async getCategory(id: string) {
    const row = await this.ds.getRepository(FinanceCategory).findOneBy({ id });
    if (!row) throw new NotFoundException("Categoría no encontrada");
    return row;
  }
  async updateCategory(id: string, dto: FinanceCategoryDto) {
    await this.getCategory(id);
    const clash = await this.ds
      .getRepository(FinanceCategory)
      .findOneBy({ name: dto.name });
    if (clash && clash.id !== id)
      throw new ConflictException("La categoría ya existe");
    await this.ds
      .getRepository(FinanceCategory)
      .update(id, { name: dto.name, kind: dto.kind });
    return this.getCategory(id);
  }
  async removeCategory(id: string) {
    await this.getCategory(id);
    const used = await this.ds.getRepository(FinanceMovement).countBy({
      categoryId: id,
    });
    if (used)
      throw new ConflictException("Hay movimientos con esta categoría");
    await this.ds.getRepository(FinanceCategory).delete(id);
  }
  async list(q: FinanceQuery = {}) {
    if (q.from && q.to && q.from > q.to)
      throw new BadRequestException("from debe ser anterior a to");
    const qb = this.ds.getRepository(FinanceMovement).createQueryBuilder("x");
    if (q.kind) qb.andWhere("x.kind = :kind", { kind: q.kind });
    if (q.categoryId)
      qb.andWhere("x.categoryId = :categoryId", { categoryId: q.categoryId });
    if (q.from) qb.andWhere("x.date >= :from", { from: q.from });
    if (q.to) qb.andWhere("x.date <= :to", { to: q.to });
    qb.orderBy("x.date", "DESC").addOrderBy("x.id", "ASC");
    const rows = await qb.getMany();
    const categories = await this.categories();
    return rows.map((row) => this.map(row, categories));
  }
  async get(id: string) {
    const row = await this.ds.getRepository(FinanceMovement).findOneBy({ id });
    if (!row) throw new NotFoundException("Movimiento no encontrado");
    return this.map(row, await this.categories());
  }
  async create(dto: FinanceMovementDto) {
    const category = await this.resolveCategory(dto.kind, dto.categoryId);
    const id = randomUUID();
    await this.ds.getRepository(FinanceMovement).save({
      id,
      kind: dto.kind,
      categoryId: category.id,
      amount: dto.amount.toFixed(2),
      date: dto.date,
      concept: dto.concept,
      detail: dto.detail,
    });
    return this.get(id);
  }
  async update(id: string, dto: FinanceMovementDto) {
    await this.get(id);
    const category = await this.resolveCategory(dto.kind, dto.categoryId);
    await this.ds.getRepository(FinanceMovement).update(id, {
      kind: dto.kind,
      categoryId: category.id,
      amount: dto.amount.toFixed(2),
      date: dto.date,
      concept: dto.concept,
      detail: dto.detail,
    });
    return this.get(id);
  }
  async remove(id: string) {
    const result = await this.ds.getRepository(FinanceMovement).delete(id);
    if (!result.affected) throw new NotFoundException("Movimiento no encontrado");
  }
  async summary(q: FinanceQuery = {}) {
    const rows = await this.list(q);
    const ingresos = money(
      rows.filter((r) => r.kind === "ingreso").reduce((n, r) => n + r.amount, 0),
    );
    const egresos = money(
      rows.filter((r) => r.kind === "egreso").reduce((n, r) => n + r.amount, 0),
    );
    return {
      from: q.from ?? null,
      to: q.to ?? null,
      ingresos,
      egresos,
      balance: money(ingresos - egresos),
      countIngresos: rows.filter((r) => r.kind === "ingreso").length,
      countEgresos: rows.filter((r) => r.kind === "egreso").length,
    };
  }
  async chartMonthly(q: FinanceChartQuery = {}) {
    const year =
      q.year ||
      Number(
        new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Argentina/Buenos_Aires",
          year: "numeric",
        }).format(new Date()),
      );
    const rows = await this.list({
      from: `${year}-01-01`,
      to: `${year}-12-31`,
    });
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      ingresos: 0,
      egresos: 0,
      balance: 0,
    }));
    for (const row of rows) {
      const bucket = months[Number(row.date.slice(5, 7)) - 1];
      if (!bucket) continue;
      if (row.kind === "ingreso") bucket.ingresos = money(bucket.ingresos + row.amount);
      else bucket.egresos = money(bucket.egresos + row.amount);
    }
    for (const bucket of months)
      bucket.balance = money(bucket.ingresos - bucket.egresos);
    return { year, months };
  }
  async chartCategories(q: FinanceChartQuery = {}) {
    const rows = await this.list({
      kind: q.kind,
      from: q.from,
      to: q.to,
    });
    const grouped = new Map<
      string,
      { categoryId: string; category: string; kind: string; total: number; count: number }
    >();
    for (const row of rows) {
      const current = grouped.get(row.categoryId) || {
        categoryId: row.categoryId,
        category: row.category,
        kind: row.kind,
        total: 0,
        count: 0,
      };
      current.total = money(current.total + row.amount);
      current.count += 1;
      grouped.set(row.categoryId, current);
    }
    return {
      kind: q.kind ?? null,
      from: q.from ?? null,
      to: q.to ?? null,
      items: [...grouped.values()].sort((a, b) => b.total - a.total),
    };
  }
  private async resolveCategory(kind: string, categoryId: string) {
    const category = await this.getCategory(categoryId);
    if (category.kind !== "ambos" && category.kind !== kind)
      throw new BadRequestException("La categoría no aplica a ese tipo de movimiento");
    return category;
  }
  private map(row: FinanceMovement, categories: FinanceCategory[]) {
    return {
      id: row.id,
      kind: row.kind,
      categoryId: row.categoryId,
      category: categories.find((c) => c.id === row.categoryId)?.name ?? "",
      amount: money(row.amount),
      date: row.date,
      concept: row.concept,
      detail: row.detail,
    };
  }
}
