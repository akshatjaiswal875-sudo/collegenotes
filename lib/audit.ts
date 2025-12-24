import { prisma } from "./prisma";

export type AuditAction =
  | "APPROVE_NOTE"
  | "REJECT_NOTE"
  | "DELETE_NOTE"
  | "CREATE_NOTE"
  | "UPDATE_NOTE"
  | "DELETE_USER"
  | "UPDATE_USER_ROLE"
  | "CREATE_SUBJECT"
  | "UPDATE_SUBJECT"
  | "DELETE_SUBJECT";

export type EntityType = "NOTE" | "USER" | "SUBJECT";

interface AuditLogParams {
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  entityName?: string;
  details?: Record<string, any>;
  admin: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}

export async function createAuditLog({
  action,
  entityType,
  entityId,
  entityName,
  details,
  admin,
}: AuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        entityName,
        details: details ? JSON.stringify(details) : null,
        adminId: admin.id,
        adminName: admin.name,
        adminEmail: admin.email,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw - audit logging should not break the main operation
  }
}

export async function getAuditLogs(options?: {
  page?: number;
  limit?: number;
  entityType?: EntityType;
  adminId?: string;
}) {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (options?.entityType) where.entityType = options.entityType;
  if (options?.adminId) where.adminId = options.adminId;

  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}
