import type { Role } from "./types";

export const roleHome: Record<Role, string> = {
  participant: "/play",
  "room-admin": "/room",
  "game-master": "/host",
  display: "/display",
};

export function getRoleHome(role: Role) {
  return roleHome[role];
}
