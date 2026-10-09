import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useEstudos from '@/hooks/useEstudos';
import ConcursoForm from '@/components/concurso/ConcursoForm';
import ConcursoSelector from '@/components/concurso/ConcursoSelector';
import PlanoGerador from '@/components/cronograma/PlanoGerador';
import SessaoRow from '@/components/cronograma/SessaoRow';
import PageHeader from '@/components/shared/PageHeader';
import EstadoVazio from '@/components/shared/EstadoVazio';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { concluirSessao, desfazerSessao } from '@/lib/gamificacao';
import { dataBR, diaSemanaCurto } from '@/lib/csv';

const FILTROS = [
  { v: 'todas', l: 'Todas' },
  { v: 'pendente', l: 'Pendentes' },
  { v: 'concluida', l: 'Concluídas' },
];

export default function Cronograma() {
  const { concursos, concursoAtivo, perfil, setPerfil, loading, carregar, selecionarConcurso } = useEstudos();
  const [sessoes, setSessoes] = useState([]);
  const [topicos, setTopicos] = useState([]);
  const [filtro, setFiltro] = useState('todas');
  const [carregando, setCarregando] = useState(false);
  const { toast } = useToast();

  const carregarTudo = useCallback(async () => {
    if (!concursoAtivo) {
      setSessoes([]);
      setTopicos([]);
      return;
    }
    setCarregando(true);
    const [paginaSessoes, paginaTopicos] = await Promise.all([
      base44.entities.Sessao.filter({ concurso_id: concursoAtivo.id }, { sort: 'data', limit: 300 }),
      base44.entities.Topico.filter({ concurso_id: concursoAtivo.id }, { sort: 'materia', limit: 500 }),
    ]);
    setSessoes(paginaSessoes.items || []);
    setTopicos(paginaTopicos.items || []);
    setCarregando(false);
  }, [concursoAtivo]);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  const grupos = useMemo(() => {
    const filtradas = filtro === 'todas' ? sessoes : sessoes.filter((s) => s.status === filtro);
    const mapa = new Map();
    filtradas.forEach((s) => {
      const dia = String(s.data || '').slice(0, 10);
      if (!mapa.has(dia)) mapa.set(dia, []);
      mapa.get(dia).push(s);
    });
    return [...mapa.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([dia, itens]) => ({ dia, itens }));
  }, [sessoes, filtro]);

  const concluir = async (sessao) => {
    if (!perfil) return;
    const res = await concluirSessao(sessao, perfil);
    setPerfil(res.perfil);
    setSessoes((prev) => prev.map((s) => (s.id === sessao.id ? { ...s, status: 'concluida', xp: res.xpGanho } : s)));
    toast({
      title: `+${res.xpGanho} XP — missão cumprida`,
      description: res.rankSubiu
        ? `Novo rank alcançado: ${res.progressoDepois.rank}!`
        : res.subiuDeNivel
          ? `Você subiu para o nível ${res.progressoDepois.nivel}!`
          : sessao.titulo,
    });
  };

  const desfazer = async (sessao) => {
    if (!perfil) return;
    const res = await desfazerSessao(sessao, perfil);
    setPerfil(res.perfil);
    setSessoes((prev) => prev.map((s) => (s.id === sessao.id ? { ...s, status: 'pendente' } : s)));
  };

  const excluir = async (sessao) => {
    setSessoes((prev) => prev.filter((s) => s.id !== sessao.id));
    await base44.entities.Sessao.delete(sessao.id);
  };

  if (!loading && !concursos.length) {
    return (
      <div>
        <PageHeader titulo="Agenda" subtitulo="Passo 1 — registre o concurso que você vai prestar." />
        <EstadoVazio
          icone={CalendarDays}
          titulo="Nenhum concurso no Sistema"
          descricao="Sem o concurso não é possível montar o cronograma. Registre e envie o edital para liberar o gerador."
          acao={<ConcursoForm onCriado={carregar} />}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        titulo="Agenda"
        subtitulo={concursoAtivo ? `Cronograma de missões — ${concursoAtivo.nome}` : 'Selecione um concurso'}
        acao={<ConcursoSelector concursos={concursos} value={concursoAtivo?.id} onChange={selecionarConcurso} />}
      />

      <div className="space-y-5">
        {concursoAtivo && <PlanoGerador concurso={concursoAtivo} topicos={topicos} onGerado={carregarTudo} />}

        <section className="system-panel system-cortes">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
            <div>
              <p className="system-label">Cronograma</p>
              <p className="font-display text-base uppercase tracking-wide text-foreground">Missões agendadas</p>
            </div>
            <div className="flex gap-2">
              {FILTROS.map((f) => (
                <button
                  key={f.v}
                  type="button"
                  onClick={() => setFiltro(f.v)}
                  className={cn(
                    'border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors',
                    filtro === f.v
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30',
                  )}
                >
                  {f.l}
                </button>
              ))}
            </div>
          </div>

          {carregando ? (
            <p className="px-5 py-12 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Carregando cronograma...
            </p>
          ) : grupos.length ? (
            <div className="max-h-[70vh] overflow-y-auto p-4">
              <div className="space-y-4">
                {grupos.map((g) => (
                  <div key={g.dia} className="border border-border/60">
                    <div className="flex items-center justify-between border-b border-border/60 bg-secondary/30 px-3 py-2">
                      <p className="font-display text-xs uppercase tracking-[0.16em] text-primary">
                        {diaSemanaCurto(g.dia)} · {dataBR(g.dia)}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        {g.itens.reduce((acc, s) => acc + (s.duracao_min || 0), 0)} min
                      </p>
                    </div>
                    {g.itens.map((s) => (
                      <SessaoRow key={s.id} sessao={s} onConcluir={concluir} onDesfazer={desfazer} onExcluir={excluir} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {sessoes.length
                  ? 'Nenhuma missão com esse filtro.'
                  : 'Nenhum cronograma gerado ainda — use o gerador acima.'}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
