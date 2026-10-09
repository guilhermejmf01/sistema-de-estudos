import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useEstudos from '@/hooks/useEstudos';
import RankLadder from '@/components/progresso/RankLadder';
import HorasPorMateria from '@/components/progresso/HorasPorMateria';
import PageHeader from '@/components/shared/PageHeader';
import EstadoVazio from '@/components/shared/EstadoVazio';
import ConcursoSelector from '@/components/concurso/ConcursoSelector';
import { Button } from '@/components/ui/button';
import { calcularProgresso } from '@/lib/leveling';

export default function Progresso() {
  const { concursos, concursoAtivo, perfil, loading, selecionarConcurso } = useEstudos();
  const [dominio, setDominio] = useState({ pendente: 0, estudando: 0, dominado: 0, total: 0 });
  const [horas, setHoras] = useState([]);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    if (!concursoAtivo) return;
    setCarregando(true);
    const [aggStatus, aggHoras] = await Promise.all([
      base44.entities.Topico.aggregate({ query: { concurso_id: concursoAtivo.id }, groupBy: 'status' }),
      base44.entities.Sessao.aggregate({
        query: { concurso_id: concursoAtivo.id, status: 'concluida' },
        groupBy: 'materia',
        sum: ['duracao_min'],
        sort: '-sum_duracao_min',
        limit: 10,
      }),
    ]);
    const mapa = Object.fromEntries((aggStatus.rows || []).map((r) => [r.status, r.count || 0]));
    setDominio({
      pendente: mapa.pendente || 0,
      estudando: mapa.estudando || 0,
      dominado: mapa.dominado || 0,
      total: (aggStatus.rows || []).reduce((acc, r) => acc + (r.count || 0), 0),
    });
    setHoras(
      (aggHoras.rows || [])
        .filter((r) => r.materia)
        .map((r) => ({
          materia: String(r.materia).slice(0, 18),
          horas: Number(((r.sum_duracao_min || 0) / 60).toFixed(1)),
        })),
    );
    setCarregando(false);
  }, [concursoAtivo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (!loading && !concursos.length) {
    return (
      <div>
        <PageHeader titulo="Rank" subtitulo="Seu progresso de caçador aparece aqui." />
        <EstadoVazio
          icone={Trophy}
          titulo="Sem dados ainda"
          descricao="Registre um concurso, importe o edital e comece a cumprir missões para ganhar XP e subir de rank."
          acao={
            <Button asChild className="system-cortes font-display uppercase tracking-[0.14em]">
              <Link to="/edital">Ir para o edital</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const progresso = calcularProgresso(perfil?.xp_total || 0);
  const tiles = [
    { label: 'XP total', valor: progresso.xpTotal },
    { label: 'Nível', valor: progresso.nivel },
    { label: 'Missões', valor: perfil?.sessoes_concluidas || 0 },
    { label: 'Horas', valor: `${Number(perfil?.horas_estudadas || 0).toFixed(1)}h` },
    { label: 'Streak', valor: `${perfil?.streak || 0}d` },
  ];
  const barras = [
    { label: 'Dominados', valor: dominio.dominado, classe: 'bg-emerald-400' },
    { label: 'Estudando', valor: dominio.estudando, classe: 'bg-primary' },
    { label: 'Pendentes', valor: dominio.pendente, classe: 'bg-slate-400' },
  ];

  return (
    <div>
      <PageHeader
        titulo="Rank"
        subtitulo={concursoAtivo ? `Progresso de caçador — ${concursoAtivo.nome}` : ''}
        acao={<ConcursoSelector concursos={concursos} value={concursoAtivo?.id} onChange={selecionarConcurso} />}
      />

      <div className="space-y-5">
        <RankLadder nivelAtual={progresso.nivel} rankAtual={progresso.rank} />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tiles.map((t) => (
            <div key={t.label} className="system-panel system-cortes px-4 py-4 text-center">
              <p className="font-display text-2xl font-bold text-foreground">{t.valor}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{t.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <section className="system-panel system-cortes p-5">
            <p className="system-label">Horas estudadas por matéria</p>
            <h3 className="mt-1 font-display text-base uppercase tracking-wide text-foreground">Esforço por disciplina</h3>
            {horas.length ? (
              <div className="mt-4">
                <HorasPorMateria dados={horas} />
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {carregando ? 'Carregando...' : 'Cumpra missões para ver suas horas por matéria.'}
              </p>
            )}
          </section>

          <section className="system-panel system-cortes p-5">
            <p className="system-label">Domínio do edital</p>
            <h3 className="mt-1 font-display text-base uppercase tracking-wide text-foreground">Tópicos por status</h3>
            <div className="mt-5 space-y-4">
              {barras.map((b) => (
                <div key={b.label}>
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    <span>{b.label}</span>
                    <span className="text-foreground/80">{b.valor}</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full border border-border bg-secondary">
                    <div
                      className={`h-full ${b.classe} transition-all duration-700`}
                      style={{ width: `${dominio.total ? Math.round((b.valor / dominio.total) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {dominio.total} tópicos no edital atual
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
