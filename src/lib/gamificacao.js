import { base44 } from '@/api/base44Client';
import { calcularProgresso, xpDaSessao } from '@/lib/leveling';
import { hojeISO, somarDias } from '@/lib/csv';

export async function carregarPerfil() {
  const user = await base44.auth.me();
  const { items } = await base44.entities.Perfil.filter({ created_by_id: user.id }, { limit: 1 });
  if (items.length) return items[0];
  return base44.entities.Perfil.create({
    xp_total: 0,
    streak: 0,
    sessoes_concluidas: 0,
    horas_estudadas: 0,
  });
}

export async function definirConcursoAtivo(perfil, concursoId) {
  if (!perfil) return null;
  return base44.entities.Perfil.update(perfil.id, { concurso_ativo_id: concursoId });
}

const calcularStreak = (perfil, hoje) => {
  const ultimo = perfil?.ultimo_estudo ? String(perfil.ultimo_estudo).slice(0, 10) : null;
  if (ultimo === hoje) return perfil.streak || 1;
  if (ultimo === somarDias(-1)) return (perfil.streak || 0) + 1;
  return 1;
};

/** Marca a missão como cumprida, credita XP e atualiza o nível */
export async function concluirSessao(sessao, perfil) {
  const xpGanho = sessao.xp || xpDaSessao(sessao.duracao_min, sessao.tipo);
  const xpTotal = (perfil?.xp_total || 0) + xpGanho;
  const antes = calcularProgresso(perfil?.xp_total || 0);
  const depois = calcularProgresso(xpTotal);
  const hoje = hojeISO();

  await base44.entities.Sessao.update(sessao.id, {
    status: 'concluida',
    concluida_em: new Date().toISOString(),
    xp: xpGanho,
  });

  const perfilAtualizado = await base44.entities.Perfil.update(perfil.id, {
    xp_total: xpTotal,
    sessoes_concluidas: (perfil.sessoes_concluidas || 0) + 1,
    horas_estudadas: Number((((perfil.horas_estudadas || 0) + (sessao.duracao_min || 0) / 60).toFixed(2))),
    streak: calcularStreak(perfil, hoje),
    ultimo_estudo: hoje,
  });

  return {
    xpGanho,
    perfil: perfilAtualizado,
    progressoAntes: antes,
    progressoDepois: depois,
    subiuDeNivel: depois.nivel > antes.nivel,
    rankSubiu: depois.rank !== antes.rank,
  };
}

/** Desfaz a missão e devolve o XP */
export async function desfazerSessao(sessao, perfil) {
  const xpPerdido = sessao.xp || xpDaSessao(sessao.duracao_min, sessao.tipo);
  await base44.entities.Sessao.update(sessao.id, { status: 'pendente', concluida_em: null });

  const perfilAtualizado = await base44.entities.Perfil.update(perfil.id, {
    xp_total: Math.max(0, (perfil?.xp_total || 0) - xpPerdido),
    sessoes_concluidas: Math.max(0, (perfil?.sessoes_concluidas || 0) - 1),
    horas_estudadas: Math.max(0, Number((((perfil?.horas_estudadas || 0) - (sessao.duracao_min || 0) / 60).toFixed(2)))),
  });

  return { xpPerdido, perfil: perfilAtualizado };
}
