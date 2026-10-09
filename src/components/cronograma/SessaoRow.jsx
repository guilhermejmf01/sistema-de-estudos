import React from 'react';
import { Check, Trash2, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tipoInfo } from '@/lib/leveling';
import { dataBR, diaSemanaCurto } from '@/lib/csv';

export default function SessaoRow({ sessao, onConcluir, onDesfazer, onExcluir, mostrarData = false }) {
  const tipo = tipoInfo(sessao.tipo);
  const concluida = sessao.status === 'concluida';

  return (
    <div
      className={cn(
        'group flex items-center gap-3 border-l-2 px-3 py-3 transition-colors',
        concluida ? 'border-emerald-400/40 bg-emerald-400/[0.04]' : 'border-primary/25 hover:bg-secondary/40',
      )}
    >
      <button
        type="button"
        onClick={() => (concluida ? onDesfazer?.(sessao) : onConcluir?.(sessao))}
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all',
          concluida
            ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300'
            : 'border-primary/40 text-transparent hover:border-primary hover:bg-primary/15 hover:text-primary',
        )}
        aria-label={concluida ? 'Desmarcar missão' : 'Concluir missão'}
      >
        {concluida ? <Undo2 className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm', concluida ? 'text-muted-foreground line-through' : 'text-foreground')}>
          {sessao.titulo}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <span className={cn('border px-1.5 py-0.5', tipo.badge)}>{tipo.label}</span>
          <span className="truncate">{sessao.materia}</span>
          <span>{sessao.duracao_min} min</span>
          {mostrarData && sessao.data && <span>{diaSemanaCurto(sessao.data)} {dataBR(sessao.data)}</span>}
        </div>
      </div>

      <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-primary/80">+{sessao.xp || 0} xp</span>

      {onExcluir && !concluida && (
        <button
          type="button"
          onClick={() => onExcluir(sessao)}
          className="shrink-0 text-muted-foreground/50 opacity-0 transition group-hover:opacity-100 hover:text-destructive"
          aria-label="Remover missão"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
