import React from "react";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";

export interface IconProps {
  size?: number;
  color?: string;
}

// Centralizing the icon set here means the rest of the app can keep
// importing "PawPrint", "Cat", "Dog", etc. by name — only this file needs
// to change if you ever swap icon libraries again.
export const PawPrint = (p: IconProps) => <MaterialCommunityIcons name="paw" size={p.size ?? 20} color={p.color ?? "#000"} />;
export const Cat = (p: IconProps) => <MaterialCommunityIcons name="cat" size={p.size ?? 20} color={p.color ?? "#000"} />;
export const Dog = (p: IconProps) => <MaterialCommunityIcons name="dog" size={p.size ?? 20} color={p.color ?? "#000"} />;
export const Scale = (p: IconProps) => <MaterialCommunityIcons name="scale-bathroom" size={p.size ?? 20} color={p.color ?? "#000"} />;
export const Syringe = (p: IconProps) => <MaterialCommunityIcons name="needle" size={p.size ?? 20} color={p.color ?? "#000"} />;
export const FileText = (p: IconProps) => <Feather name="file-text" size={p.size ?? 20} color={p.color ?? "#000"} />;
export const UtensilsCrossed = (p: IconProps) => <MaterialCommunityIcons name="silverware-fork-knife" size={p.size ?? 20} color={p.color ?? "#000"} />;
export const Clock3 = (p: IconProps) => <Feather name="clock" size={p.size ?? 20} color={p.color ?? "#000"} />;
export const Plus = (p: IconProps) => <Feather name="plus" size={p.size ?? 20} color={p.color ?? "#000"} />;
export const Minus = (p: IconProps) => <Feather name="minus" size={p.size ?? 20} color={p.color ?? "#000"} />;
export const Check = (p: IconProps) => <Feather name="check" size={p.size ?? 20} color={p.color ?? "#000"} />;
export const ChevronRight = (p: IconProps) => <Feather name="chevron-right" size={p.size ?? 20} color={p.color ?? "#000"} />;
export const ChevronLeft = (p: IconProps) => <Feather name="chevron-left" size={p.size ?? 20} color={p.color ?? "#000"} />;
export const Mail = (p: IconProps) => <Feather name="mail" size={p.size ?? 20} color={p.color ?? "#000"} />;
export const X = (p: IconProps) => <Feather name="x" size={p.size ?? 20} color={p.color ?? "#000"} />;
export const Home = (p: IconProps) => <Feather name="home" size={p.size ?? 20} color={p.color ?? "#000"} />;
export const BarChart = (p: IconProps) => <Feather name="bar-chart-2" size={p.size ?? 20} color={p.color ?? "#000"} />;
export const Package = (p: IconProps) => <MaterialCommunityIcons name="package-variant" size={p.size ?? 20} color={p.color ?? "#000"} />;
export const Flame = (p: IconProps) => <Feather name="zap" size={p.size ?? 20} color={p.color ?? "#000"} />;
export const TrendingUp = (p: IconProps) => <Feather name="trending-up" size={p.size ?? 20} color={p.color ?? "#000"} />;
export const AlertCircle = (p: IconProps) => <Feather name="alert-circle" size={p.size ?? 20} color={p.color ?? "#000"} />;
export const ChevronDown = (p: IconProps) => <Feather name="chevron-down" size={p.size ?? 20} color={p.color ?? "#000"} />;

export type IconComponent = (p: IconProps) => React.ReactElement;
