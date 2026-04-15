"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface NavbarAvatarProps {
  email?: string;
  userName?: string;
  size?: number;
  className?: string;
  defaultAvatarPath?: string;
  refreshTrigger?: number; // Trigger para forzar recarga
}

export function NavbarAvatar({
  email,
  userName,
  size = 35,
  className = "",
  defaultAvatarPath = "/img/default_avatar.png",
  refreshTrigger = 0,
}: NavbarAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      setAvatarUrl(defaultAvatarPath);
      return;
    }

    setLoading(true);
    const fetchAvatar = async () => {
      try {
        const response = await fetch("/api/perfil");
        if (response.ok) {
          const data = await response.json();
          setAvatarUrl(data.avatar_url || defaultAvatarPath);
        } else {
          setAvatarUrl(defaultAvatarPath);
        }
      } catch (error) {
        console.error("Error cargando avatar:", error);
        setAvatarUrl(defaultAvatarPath);
      } finally {
        setLoading(false);
      }
    };

    fetchAvatar();
  }, [email, defaultAvatarPath, refreshTrigger]);

  return (
    <Image
      src={avatarUrl || defaultAvatarPath}
      alt={userName || "Avatar"}
      width={size}
      height={size}
      className={`rounded-full border border-white ${className}`}
      unoptimized={avatarUrl?.startsWith("data:") || false}
      priority={false}
    />
  );
}
