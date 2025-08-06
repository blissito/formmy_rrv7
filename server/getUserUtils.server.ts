import { redirect } from "react-router";
import { type User, Role, type Rights } from "@prisma/client";
import { getSession } from "../app/sessions";
import { db } from "../app/utils/db.server";
import { redirectToGoogle } from "../app/lib/google.server";

// Este archivo es SOLO para uso en el servidor. No debe ser importado desde ningún código que termine en el cliente.

export const getUserOrRedirect = async (request: Request): Promise<User> => {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("userId")) {
    throw redirect("/");
  }
  const user = (await db.user.findUnique({
    where: { email: session.get("userId") },
  })) as User;
  if (!user) {
    throw redirect("/");
  }
  return user as User;
};

export const getUserOrTriggerLogin = async (request: Request) => {
  const user = await getUserOrNull(request);
  if (!user) {
    const url = new URL(request.url);
    throw redirectToGoogle(redirect, url.host);
  }
  return user;
};

export const getUserOrNull = async (request: Request): Promise<User | null> => {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("userId")) {
    return null;
  }
  const user = await db.user.findUnique({
    where: { email: session.get("userId") },
  });
  if (!user) {
    return null;
  }
  return user;
};

const ADMINS = ["fixtergeek@gmail.com", "bremin11.20.93@gmail.com"];

export const getAdminUserOrRedirect = async (
  request: Request
): Promise<User> => {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("userId")) {
    throw redirect("/");
  }
  const user = (await db.user.findUnique({
    where: { email: session.get("userId") },
  })) as User;
  if (!user) {
    throw redirect("/");
  }
  if (!ADMINS.includes(user.email)) {
    throw redirect("/");
  }
  return user;
};

export const getProjectOwner = async ({
  userId,
  projectId,
}: {
  userId: string;
  projectId: string;
}) => {
  return await db.project.findUnique({
    where: {
      id: projectId,
      userId: userId,
    },
    include: {
      answers: {
        where: {
          deleted: false, // Is this ok in here?
        },
        orderBy: {
          createdAt: "desc",
        },
      }, // consider appart to filter?
    },
  });
};

export const getPermission = ({
  userId,
  projectId,
}: {
  userId: string;
  projectId: string;
}) => {
  return db.permission.findFirst({
    where: {
      userId,
      projectId,
      resourceType: "PROJECT",
    },
    include: {
      project: {
        include: {
          answers: {
            where: {
              deleted: false, // Is this ok in here?
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
  });
};

export const redirectIfUser = async (request: Request) => {
  const cookie = request.headers.get("Cookie");
  const session = await getSession(cookie);
  if (session.has("userId")) {
    throw redirect("/dashboard");
  }
};

// Helper function to get permissions based on role
export const getRolePermissions = (role: Role): Rights => {
  switch (role) {
    case Role.VIEWER:
      return {
        read: true,
        write: false,
        update: false,
        delete: false,
      };
    case Role.EDITOR:
      return {
        read: true,
        write: true,
        update: true,
        delete: false,
      };
    case Role.ADMIN:
      return {
        read: true,
        write: true,
        update: true,
        delete: true,
      };
    default:
      return {
        read: true,
        write: false,
        update: false,
        delete: false,
      };
  }
};

// Helper function to check if user has specific permission
export const hasPermission = async (
  userId: string,
  projectId: string,
  action: keyof Rights
): Promise<boolean> => {
  // Check if user is owner
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
  });
  
  if (project) return true; // Owner has all permissions
  
  // Check user's permission for the project
  const permission = await db.permission.findFirst({
    where: {
      userId,
      projectId,
      resourceType: "PROJECT",
      status: "active",
    },
  });
  
  if (!permission) return false;
  
  // Use role-based permissions
  const rolePermissions = getRolePermissions(permission.role);
  return rolePermissions[action] === true;
};

// Centralized function to get project with permissions validation
export const getProjectWithAccess = async (
  userId: string,
  projectId: string,
  requiredPermission?: keyof Rights
) => {
  // Try to get project as owner first
  let project = await getProjectOwner({ userId, projectId });
  
  if (project) {
    return {
      project,
      isOwner: true,
      userRole: "OWNER" as const,
      permissions: {
        read: true,
        write: true,
        update: true,
        delete: true,
      },
    };
  }
  
  // If not owner, check if user has permission to access
  const permission = await getPermission({ projectId, userId });
  
  if (!permission || permission.status !== "active" || !permission.project) {
    return null; // No access
  }
  
  // Get role-based permissions
  const rolePermissions = getRolePermissions(permission.role);
  
  // Check if user has the required permission level
  if (requiredPermission && !rolePermissions[requiredPermission]) {
    throw new Response("Forbidden - Insufficient permissions", { status: 403 });
  }
  
  return {
    project: permission.project,
    isOwner: false,
    userRole: permission.role,
    permissions: rolePermissions,
  };
};
