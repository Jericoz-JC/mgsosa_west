import { CircleHelp, Droplets, Grid3x3, Image as ImageIcon, PencilLine, UsersRound, Zap } from "lucide-react";
import type { GameIcon as GameIconName } from "@/lib/games/registry";

const icons = {
  users: UsersRound,
  pencil: PencilLine,
  help: CircleHelp,
  grid: Grid3x3,
  zap: Zap,
  droplet: Droplets,
  image: ImageIcon,
} satisfies Record<GameIconName, unknown>;

export function GameIcon({ name, size = 22 }: { name: GameIconName; size?: number }) {
  const Icon = icons[name];
  return <Icon aria-hidden size={size} />;
}
