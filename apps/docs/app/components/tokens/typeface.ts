import { cn } from "~/lib/utils";

export const typefaceHeading1 = (className?: string) =>
  cn("text-4xl font-bold tracking-tight", className);

export const typefaceHeading2 = (className?: string) =>
  cn("border-b pb-1 text-3xl font-semibold tracking-tight", className);

export const typefaceHeading3 = (className?: string) =>
  cn("text-2xl font-semibold tracking-tight", className);

export const typefaceHeading4 = (className?: string) =>
  cn("text-xl font-semibold tracking-tight", className);

export const typefaceHeading5 = (className?: string) =>
  cn("text-lg font-semibold tracking-tight", className);

export const typefaceHeading6 = (className?: string) =>
  cn("text-base font-semibold tracking-tight", className);

export const typefaceBody = (className?: string) => cn("leading-7", className);

export const typefaceMeta = (className?: string) =>
  cn("text-sm font-normal", className);

export const typefaceAnchor = (className?: string) =>
  cn("font-medium underline underline-offset-4", className);
