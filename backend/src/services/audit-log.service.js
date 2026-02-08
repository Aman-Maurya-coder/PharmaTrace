import { AuditLog } from "../models/AuditLog.model.js";

class AuditLogService {
  async record(entry) {
    const doc = await AuditLog.create({
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      actorId: entry.actorId,
      timestamp: new Date()
    });
    return { id: doc.id ?? null };
  }
}

export const auditLogService = new AuditLogService();
