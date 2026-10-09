import React from 'react';
import { Sparkles } from 'lucide-react';

export default function EstadoVazio({ icone: Icone = Sparkles, titulo, descricao, acao }) {
  return (
    <div className="system-panel system-cortes flex flex-col items-center gap-4 px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/5 text-primary">
        <Icone className="h-6 w-6" />
      </div>
      <div className="space-y-1.5">
        <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-foreground">{titulo}</h3>
        {descricao && <p className="mx-auto max-w-md text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {acao}
    </div>
  );
}
