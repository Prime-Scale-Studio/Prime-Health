import * as React from "react";
import { cn } from "@/lib/utils";

// Deterministic background from name string
function getAvatarColour(name: string): string {
  const colours = [
    "from-blue-500 to-indigo-600",
    "from-violet-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-sky-600",
    "from-fuchsia-500 to-pink-600",
    "from-lime-500 to-green-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colours[Math.abs(hash) % colours.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  ring?: boolean;
}

// ─────────────────────────────────────────────
// Sizes
// ─────────────────────────────────────────────

const sizeMap = {
  xs: { wrapper: "h-6 w-6 text-[10px]",  ring: "ring-1" },
  sm: { wrapper: "h-8 w-8 text-xs",       ring: "ring-1" },
  md: { wrapper: "h-10 w-10 text-sm",     ring: "ring-2" },
  lg: { wrapper: "h-12 w-12 text-base",   ring: "ring-2" },
  xl: { wrapper: "h-16 w-16 text-lg",     ring: "ring-2" },
} as const;

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, name, src, size = "md", ring = false, ...props }, ref) => {
    const [imgError, setImgError] = React.useState(false);
    const initials = getInitials(name);
    const gradient = getAvatarColour(name);
    const sizes = sizeMap[size];
    const showImage = src && !imgError;

    return (
      <div
        ref={ref}
        role="img"
        aria-label={name}
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full",
          "flex items-center justify-center select-none",
          sizes.wrapper,
          ring && `ring-background ${sizes.ring}`,
          !showImage && `bg-gradient-to-br ${gradient} text-white font-bold`,
          className
        )}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt={name}
            className="aspect-square h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="leading-none">{initials}</span>
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

// ─────────────────────────────────────────────
// AvatarGroup — stacked avatars
// ─────────────────────────────────────────────

function AvatarGroup({
  users,
  max = 4,
  size = "sm",
}: {
  users: { name: string; src?: string | null }[];
  max?: number;
  size?: AvatarProps["size"];
}) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((user, i) => (
        <Avatar
          key={i}
          name={user.name}
          src={user.src}
          size={size}
          ring
          className="relative"
          style={{ zIndex: visible.length - i }}
        />
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full",
            "bg-muted text-muted-foreground font-semibold border-2 border-background",
            sizeMap[size].wrapper,
            "text-xs ring-2 ring-background"
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

export { Avatar, AvatarGroup };
