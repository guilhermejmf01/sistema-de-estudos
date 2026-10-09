import React from 'react';
import { Flame, Sword, Timer } from 'lucide-react';
import RankBadge from '@/components/shared/RankBadge';
import XpBar from '@/components/shared/XpBar';
import { calcularProgresso } from '@/lib/leveling';

export default function HunterCard({ perfil }) {
  const progresso = calcularProgresso(perfil?.xp_total || 0);
  const info = progresso.rankInfo;
  const stats = [
    { label: 'Missões', valor: perfil?.sessoes_concluidas || 0, icon: Sword },
    { label: 'Horas', valor: `${Number(perfil?.horas_estudadas || 0).toFixed(1)}h`, icon: Timer },
    { label: 'Streak', valor: `${perfil?.streak || 0}d`, icon: Flame },
  ];

  return (
    <section className="system-panel system-cortes relative overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-20 -top-24 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
        <RankBadge rank={progresso.rank} size="lg" />
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <p className="system-label">Rank {info.rank} — {info.titulo}</p>
            <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-foreground">Nível {progresso.nivel}</h2>
            {progresso.proximoRank && (
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Rank {progresso.proximoRank.rank} em {progresso.niveisParaProximoRank} nível(is)
              </p>
            )}
          </div>
          <XpBar progresso={progresso} />
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="border border-border/70 bg-secondary/30 px-3 py-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <s.icon className="h-3.5 w-3.5" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em]">{s.label}</span>
            </div>
            <p className="mt-1 font-display text-xl font-semibold text-foreground">{s.valor}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
