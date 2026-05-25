import { cn } from "~/lib/utils";

/**
 * Type scale based on 1.2 ratio (minor third).
 * Headings use font-heading (JetBrains Mono) with tighter tracking.
 * Body uses font-sans (Inter) with comfortable leading.
 */

export const typefaceHeading1 = (className?: string) =>
  cn(
    "font-heading text-[2.488rem] font-bold tracking-[-0.02em] leading-[1.15]",
    className
  );

export const typefaceHeading2 = (className?: string) =>
  cn(
    "font-heading text-[2.074rem] font-bold tracking-[-0.02em] leading-[1.2]",
    className
  );

export const typefaceHeading3 = (className?: string) =>
  cn(
    "font-heading text-[1.728rem] font-semibold tracking-[-0.015em] leading-[1.25]",
    className
  );

export const typefaceHeading4 = (className?: string) =>
  cn(
    "font-heading text-[1.44rem] font-semibold tracking-[-0.01em] leading-[1.3]",
    className
  );

export const typefaceHeading5 = (className?: string) =>
  cn(
    "font-heading text-[1.2rem] font-medium tracking-[-0.01em] leading-[1.4]",
    className
  );

export const typefaceHeading6 = (className?: string) =>
  cn(
    "font-heading text-base font-medium tracking-[-0.005em] leading-[1.4]",
    className
  );

export const typefaceBody = (className?: string) =>
  cn("font-sans text-base leading-[1.7] tracking-normal", className);

export const typefaceMeta = (className?: string) =>
  cn(
    "font-sans text-[0.8125rem] font-medium leading-[1.5] tracking-[0.01em]",
    className
  );

export const typefaceAnchor = (className?: string) =>
  cn(
    "font-medium underline decoration-primary/40 underline-offset-[3px] hover:decoration-primary transition-colors duration-150",
    className
  );
