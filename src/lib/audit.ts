import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

type AuditLogParams = {
  userId?: string;
  userEmail: string;
  userRole: "donor" | "recipient" | "hospital";
  action: string;
  entity: string;
  entityId: string;
  previousState?: any;
  newState?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
};

export async function createAuditLog(params: AuditLogParams) {
  try {
    await db.insert(auditLogs).values({
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      previousState: params.previousState,
      newState: params.newState,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
