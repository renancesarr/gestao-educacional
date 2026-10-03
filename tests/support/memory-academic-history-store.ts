import type { AcademicHistory, AcademicHistoryStore } from '../../src/academic/history.ts';

export class MemoryAcademicHistoryStore implements AcademicHistoryStore {
  private readonly records = new Map<string, AcademicHistory>();
  async create(value: AcademicHistory) { this.records.set(value.id, value); return 'created' as const; }
  async list(tenantId: string, studentId?: string) { return [...this.records.values()].filter(item => item.tenantId === tenantId && (!studentId || item.studentId === studentId)); }
  async get(tenantId: string, id: string) { const item = this.records.get(id); return item?.tenantId === tenantId ? item : null; }
  async update(value: AcademicHistory) { if (!this.records.has(value.id)) return 'missing' as const; this.records.set(value.id, value); return 'updated' as const; }
  async delete(tenantId: string, id: string) { const item = await this.get(tenantId, id); return item ? this.records.delete(id) : false; }
}
