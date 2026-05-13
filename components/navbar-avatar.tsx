"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";

interface NavbarAvatarProps {
  userName?: string;
  size?: number;
  className?: string;
  defaultAvatarPath?: string;
}

export function NavbarAvatar({
  userName,
  size = 35,
  className = "",
  defaultAvatarPath = "/img/perfil.jpg",
}: NavbarAvatarProps) {
  const { data: session } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Cada vez que cambia la sesión, refetch el avatar
  useEffect(() => {
    if (!session?.user?.id) {
      setAvatarUrl(null);
      return;
    }

    const fetchAvatar = async () => {
      try {
        const response = await fetch(`/api/perfil?t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          // Aceptar data URIs sin filtro, o URLs HTTP sin "ucv"
          if (
            data.avatar_url && 
            (data.avatar_url.startsWith("data:") || !data.avatar_url.toLowerCase().includes("ucv"))
          ) {
            setAvatarUrl(data.avatar_url);
          } else {
            setAvatarUrl(null);
          }
        }
      } catch (error) {
        setAvatarUrl(null);
      }
    };

    fetchAvatar();

    // Escuchar evento de actualización de avatar
    const handleAvatarUpdated = () => {
      fetchAvatar();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("avatarUpdated", handleAvatarUpdated);
      return () => window.removeEventListener("avatarUpdated", handleAvatarUpdated);
    }
  }, [session?.user?.id]);

  const displayUrl = avatarUrl || defaultAvatarPath;

  return (
    <Image
      key={avatarUrl} // Forzar re-render cuando cambia avatarUrl
      src={displayUrl}
      alt={userName || "Avatar"}
      width={size}
      height={size}
      className={`rounded-full border border-white transition-all duration-300 ${className}`}
      unoptimized={displayUrl?.startsWith("data:") || false}
      priority={false}
    />
  );
}
