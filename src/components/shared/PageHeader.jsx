import React from 'react';

export default function PageHeader({ titulo, subtitulo, acao }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="system-label mb-2">Sistema de estudos</p>
        <h1 className="font-display text-3xl font-semibold uppercase tracking-wide text-foreground sm:text-4xl">{titulo}</h1>
        {subtitulo && <p className="mt-2 text-sm text-muted-foreground">{subtitulo}</p>}
      </div>
      {acao && <div className="shrink-0">{acao}</div>}
    </div>
  );
}
