import React from 'react';
import { RANKS } from '@/lib/leveling';
import { cn } from '@/lib/utils';

const TAMANHOS = {
  xs: 'h-7 w-7 text-xs',
  sm: 'h-10 w-10 text-lg',
  md: 'h-16 w-16 text-3xl',
  lg: 'h-24 w-24 text-5xl',
};

export default function RankBadge({ rank = 'E', size = 'md', className }) {
  const info = RANKS.find((r) => r.rank === rank) || RANKS[0];
  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center border font-display font-bold',
        info.border,
        info.bg,
        info.text,
        info.glow,
        TAMANHOS[size] || TAMANHOS.md,
        className,
      )}
      style={{ clipPath: 'polygon(16% 0, 100% 0, 100% 84%, 84% 100%, 0 100%, 0 16%)' }}
    >
      {info.rank}
    </div>
  );
}
