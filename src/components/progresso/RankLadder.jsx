import React from 'react';
import RankBadge from '@/components/shared/RankBadge';
import { RANKS } from '@/lib/leveling';
import { cn } from '@/lib/utils';

export default function RankLadder({ nivelAtual = 1, rankAtual = 'E' }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {RANKS.map((r) => {
        const alcancado = nivelAtual >= r.minLevel;
        const atual = rankAtual === r.rank;
        return (
          <div
            key={r.rank}
            className={cn(
              'system-panel system-cortes flex flex-col items-center gap-2 p-4 text-center transition-all',
              atual && 'system-panel-ativo',
              !alcancado && 'opacity-45',
            )}
          >
            <RankBadge rank={r.rank} size="sm" />
            <p className={cn('font-display text-xs uppercase tracking-[0.14em]', r.text)}>{r.titulo}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Nível {r.minLevel}+</p>
          </div>
        );
      })}
    </div>
  );
}
