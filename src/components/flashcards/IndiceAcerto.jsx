import React from 'react';

const corBarra = (indice, total) => {
  if (!total) return 'bg-border';
  if (indice >= 80) return 'bg-emerald-400';
  if (indice >= 50) return 'bg-amber-400';
  return 'bg-red-400';
};

export default function IndiceAcerto({ geral, linhas = [] }) {
  return (
    <section className="system-panel system-cortes p-5">
      <p className="system-label">Desempenho</p>
      <h3 className="mt-1 font-display text-base uppercase tracking-wide text-foreground">Índice de acerto</h3>

      <div className="mt-4 flex flex-wrap items-end gap-6">
        <div>
          <p className="font-display text-4xl font-bold text-primary">{geral.indice === null ? '—' : `${geral.indice}%`}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            índice geral em {geral.respostas} respostas
          </p>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="font-display text-xl font-semibold text-emerald-300">{geral.acertos}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">acertos</p>
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-red-300">{geral.erros}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">erros</p>
          </div>
        </div>
      </div>

      {linhas.length ? (
        <div className="mt-6 space-y-3">
          {linhas.map((l) => (
            <div key={l.materia}>
              <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.14em]">
                <span className="truncate text-foreground/80">{l.materia}</span>
                <span className="shrink-0 text-muted-foreground">
                  {l.total ? `${l.indice}% · ${l.acertos}/${l.total}` : `${l.cartoes} cartões · sem revisões`}
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full border border-border bg-secondary">
                <div
                  className={`h-full ${corBarra(l.indice, l.total)} transition-all duration-700`}
                  style={{ width: `${l.total ? l.indice : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">Cadastre flashcards para começar a medir seu desempenho.</p>
      )}
    </section>
  );
}
