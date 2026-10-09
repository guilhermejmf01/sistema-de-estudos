import React from 'react';
import { Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STATUS_TOPICO } from '@/lib/leveling';
import { cn } from '@/lib/utils';

export default function TopicoRow({ topico, onStatus, onExcluir }) {
  const status = STATUS_TOPICO.find((s) => s.value === topico.status) || STATUS_TOPICO[0];

  return (
    <div className="group flex items-center gap-3 border-b border-border/40 px-3 py-2.5 last:border-b-0 hover:bg-secondary/30">
      <span
        className={cn(
          'h-1.5 w-1.5 shrink-0 rounded-full',
          topico.peso >= 4
            ? 'bg-primary shadow-[0_0_8px_1px_rgba(34,211,238,0.7)]'
            : topico.peso === 3
              ? 'bg-muted-foreground'
              : 'bg-border',
        )}
      />
      <p className="min-w-0 flex-1 truncate text-sm text-foreground/90">{topico.titulo}</p>
      <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:block">
        P{topico.peso}
      </span>

      <Select value={topico.status} onValueChange={(v) => onStatus(topico, v)}>
        <SelectTrigger className={cn('h-8 w-[124px] shrink-0 border bg-transparent font-mono text-[10px] uppercase tracking-[0.14em]', status.classe)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_TOPICO.map((s) => (
            <SelectItem key={s.value} value={s.value} className="font-mono text-xs uppercase tracking-[0.12em]">
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        type="button"
        onClick={() => onExcluir(topico)}
        className="shrink-0 text-muted-foreground/50 opacity-0 transition group-hover:opacity-100 hover:text-destructive"
        aria-label="Remover tópico"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
