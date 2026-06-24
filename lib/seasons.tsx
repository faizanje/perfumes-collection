import { Flower2, Snowflake, Sun, Umbrella, Leaf, Moon, type LucideIcon } from "lucide-react";
import type { Season } from "./types";

export interface SeasonMeta {
  label: string;
  short: string;
  Icon: LucideIcon;
  color: string;
}

// Fragrantica-style season colors.
export const SEASON_META: Record<Season, SeasonMeta> = {
  spring: { label: "Spring", short: "Spring", Icon: Flower2, color: "#74b43a" },
  summer: { label: "Summer", short: "Summer", Icon: Umbrella, color: "#ef6b6b" },
  fall: { label: "Autumn", short: "Autumn", Icon: Leaf, color: "#e0892b" },
  winter: { label: "Winter", short: "Winter", Icon: Snowflake, color: "#4a90d9" },
};

export const SEASON_ORDER: Season[] = ["spring", "summer", "fall", "winter"];

export const TIME_META: Record<string, { Icon: LucideIcon; color: string }> = {
  Day: { Icon: Sun, color: "#f0a830" },
  Night: { Icon: Moon, color: "#6a7fd0" },
};
