import { User } from "../database/entities";

export const WRITE_ROLES = ["admin", "manager"] as const;

export function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role?.name,
    roleId: user.roleId,
  };
}

export function canMutate(roleName?: string) {
  return roleName === "admin" || roleName === "manager";
}
