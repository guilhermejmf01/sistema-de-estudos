import React from 'react';
import { cn } from '@/lib/utils';

export default function XpBar({ progresso, className, mostrarRotulos = true }) {
  return (
    <div className={cn('space-y-2', className)}>
      {mostrarRotulos && (
        <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <span>XP {progresso.xpNoNivel} / {progresso.xpNecessario}</span>
          <span className="text-right">Faltam {progresso.xpFaltando} para o nível {progresso.nivel + 1}</span>
        </div>
      )}
      <div className="h-2.5 w-full overflow-hidden rounded-full border border-border bg-secondary">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary/60 via-primary to-primary transition-all duration-700 ease-out"
          style={{ width: `${progresso.progresso}%` }}
        />
      </div>
    </div>
  );
}
