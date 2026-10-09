import React, { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const estiloIndice = (indice) => {
  if (indice === null) return 'border-slate-400/30 text-slate-300';
  if (indice >= 80) return 'border-emerald-400/40 text-emerald-300';
  if (indice >= 50) return 'border-amber-400/40 text-amber-300';
  return 'border-red-400/40 text-red-300';
};

export default function FlashcardRow({ cartao, onEditar, onExcluir }) {
  const [virado, setVirado] = useState(false);
  const total = (cartao.acertos || 0) + (cartao.erros || 0);
  const indice = total ? Math.round(((cartao.acertos || 0) / total) * 100) : null;

  return (
    <div className="group flex items-start gap-3 border-b border-border/40 px-4 py-3 last:border-b-0 hover:bg-secondary/30">
      <button type="button" onClick={() => setVirado((v) => !v)} className="min-w-0 flex-1 text-left">
        <p className="system-label mb-1">{virado ? cartao.verso ? 'Verso' : '—' : 'Frente'}</p>
        <p className="text-sm leading-relaxed text-foreground/90">{virado ? cartao.verso : cartao.frente}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <span className="truncate">{cartao.materia}</span>
          <span>{total ? `${cartao.acertos}/${total} respostas` : 'novo'}</span>
        </div>
      </button>

      <span
        className={cn('shrink-0 border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em]', estiloIndice(indice))}
        title="Índice de acerto deste cartão"
      >
        {indice === null ? '—' : `${indice}%`}
      </span>

      <div className="flex shrink-0 items-center gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
        <button type="button" onClick={() => onEditar(cartao)} className="text-muted-foreground/60 hover:text-primary" aria-label="Editar flashcard">
          <Pencil className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => onExcluir(cartao)} className="text-muted-foreground/60 hover:text-destructive" aria-label="Excluir flashcard">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
