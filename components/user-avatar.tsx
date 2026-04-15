"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMemo } from "react";

interface UserAvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: { container: "h-8 w-8", text: "text-xs" },
  md: { container: "h-12 w-12", text: "text-sm" },
  lg: { container: "h-16 w-16", text: "text-lg" },
  xl: { container: "h-24 w-24", text: "text-2xl" },
};

export function UserAvatar({
  src,
  alt = "Avatar",
  fallback = "U",
  className = "",
  size = "md",
}: UserAvatarProps) {
  const sizeConfig = sizeMap[size];
  const isBase64 = useMemo(() => src?.startsWith("data:") || false, [src]);

  return (
    <Avatar className={`${sizeConfig.container} ${className}`} key={src}>
      <AvatarImage
        src={src || ""}
        alt={alt}
        unoptimized={isBase64}
      />
      <AvatarFallback className={sizeConfig.text}>{fallback}</AvatarFallback>
    </Avatar>
  );
}
