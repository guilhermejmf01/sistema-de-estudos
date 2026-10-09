export const RANKS = [
  { rank: 'E', minLevel: 1, titulo: 'Desperto', text: 'text-slate-300', border: 'border-slate-400/40', bg: 'bg-slate-400/10', glow: 'shadow-[0_0_26px_-8px_rgba(148,163,184,0.85)]', bar: 'bg-slate-300' },
  { rank: 'D', minLevel: 5, titulo: 'Caçador', text: 'text-emerald-300', border: 'border-emerald-400/40', bg: 'bg-emerald-400/10', glow: 'shadow-[0_0_26px_-8px_rgba(52,211,153,0.85)]', bar: 'bg-emerald-400' },
  { rank: 'C', minLevel: 10, titulo: 'Veterano', text: 'text-cyan-300', border: 'border-cyan-400/40', bg: 'bg-cyan-400/10', glow: 'shadow-[0_0_28px_-8px_rgba(34,211,238,0.85)]', bar: 'bg-cyan-400' },
  { rank: 'B', minLevel: 15, titulo: 'Elite', text: 'text-blue-400', border: 'border-blue-500/40', bg: 'bg-blue-500/10', glow: 'shadow-[0_0_28px_-8px_rgba(59,130,246,0.9)]', bar: 'bg-blue-500' },
  { rank: 'A', minLevel: 20, titulo: 'Mestre', text: 'text-fuchsia-400', border: 'border-fuchsia-500/40', bg: 'bg-fuchsia-500/10', glow: 'shadow-[0_0_30px_-8px_rgba(232,121,249,0.9)]', bar: 'bg-fuchsia-500' },
  { rank: 'S', minLevel: 25, titulo: 'Monarca', text: 'text-amber-300', border: 'border-amber-400/50', bg: 'bg-amber-400/10', glow: 'shadow-[0_0_34px_-8px_rgba(251,191,36,0.95)]', bar: 'bg-amber-400' },
];

export const xpParaNivel = (nivel) => 100 + (nivel - 1) * 50;

export const rankDoNivel = (nivel) =>
  [...RANKS].reverse().find((r) => nivel >= r.minLevel) || RANKS[0];

export function calcularProgresso(xpTotal = 0) {
  let nivel = 1;
  let restante = Math.max(0, Math.round(xpTotal));
  while (restante >= xpParaNivel(nivel) && nivel < 99) {
    restante -= xpParaNivel(nivel);
    nivel += 1;
  }
  const necessario = xpParaNivel(nivel);
  const rank = rankDoNivel(nivel);
  const proximo = RANKS.find((r) => r.minLevel > nivel) || null;
  return {
    nivel,
    xpTotal: Math.max(0, Math.round(xpTotal)),
    xpNoNivel: restante,
    xpNecessario: necessario,
    xpFaltando: necessario - restante,
    progresso: Math.min(100, Math.round((restante / necessario) * 100)),
    rank: rank.rank,
    rankInfo: rank,
    proximoRank: proximo,
    niveisParaProximoRank: proximo ? proximo.minLevel - nivel : 0,
  };
}

export const TIPOS = [
  { value: 'teoria', label: 'Teoria', base: 15, badge: 'border-sky-400/30 bg-sky-400/10 text-sky-300' },
  { value: 'questoes', label: 'Questões', base: 25, badge: 'border-violet-400/30 bg-violet-400/10 text-violet-300' },
  { value: 'revisao', label: 'Revisão', base: 10, badge: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' },
  { value: 'simulado', label: 'Simulado', base: 40, badge: 'border-amber-400/40 bg-amber-400/10 text-amber-300' },
];

export const tipoInfo = (tipo) => TIPOS.find((t) => t.value === tipo) || TIPOS[0];

export const xpDaSessao = (duracaoMin = 60, tipo = 'teoria') =>
  Math.round(((duracaoMin || 60) / 30) * tipoInfo(tipo).base);

export const STATUS_TOPICO = [
  { value: 'pendente', label: 'Pendente', classe: 'border-slate-400/30 text-slate-300' },
  { value: 'estudando', label: 'Estudando', classe: 'border-primary/40 text-primary' },
  { value: 'dominado', label: 'Dominado', classe: 'border-emerald-400/40 text-emerald-300' },
];
