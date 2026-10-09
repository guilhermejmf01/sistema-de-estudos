import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, ScrollText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useEstudos from '@/hooks/useEstudos';
import HunterCard from '@/components/dashboard/HunterCard';
import SessaoRow from '@/components/cronograma/SessaoRow';
import PageHeader from '@/components/shared/PageHeader';
import EstadoVazio from '@/components/shared/EstadoVazio';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { concluirSessao, desfazerSessao } from '@/lib/gamificacao';
import { dataBR, diaSemanaCurto, hojeISO, somarDias } from '@/lib/csv';

export default function Dashboard() {
  const { concursoAtivo, perfil, setPerfil, loading: carregandoBase } = useEstudos();
  const [sessoes, setSessoes] = useState([]);
  const [proximas, setProximas] = useState(0);
  const [topicos, setTopicos] = useState({ total: 0, pendente: 0, estudando: 0, dominado: 0 });
  const [carregando, setCarregando] = useState(false);
  const { toast } = useToast();
  const hoje = hojeISO();

  const carregar = useCallback(async () => {
    if (!concursoAtivo) return;
    setCarregando(true);
    const [pagina, totalProximas, porStatus] = await Promise.all([
      base44.entities.Sessao.filter({ concurso_id: concursoAtivo.id, data: hoje }, { sort: 'materia', limit: 50 }),
      base44.entities.Sessao.count({
        concurso_id: concursoAtivo.id,
        status: 'pendente',
        data: { $gt: hoje, $lte: somarDias(7) },
      }),
      base44.entities.Topico.aggregate({ query: { concurso_id: concursoAtivo.id }, groupBy: 'status' }),
    ]);
    setSessoes(pagina.items || []);
    setProximas(totalProximas || 0);
    const mapa = Object.fromEntries((porStatus.rows || []).map((r) => [r.status, r.count || 0]));
    setTopicos({
      total: (porStatus.rows || []).reduce((acc, r) => acc + (r.count || 0), 0),
      pendente: mapa.pendente || 0,
      estudando: mapa.estudando || 0,
      dominado: mapa.dominado || 0,
    });
    setCarregando(false);
  }, [concursoAtivo, hoje]);

  useEffect(() => {
    carregar();
  }, [carregar]);

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

  if (!carregandoBase && !concursoAtivo) {
    return (
      <div>
        <PageHeader titulo="Painel" subtitulo="Nenhum concurso registrado no Sistema ainda." />
        <EstadoVazio
          icone={ScrollText}
          titulo="Inicie o Sistema"
          descricao="Registre seu concurso, importe o CSV com os tópicos do edital e deixe a IA montar o cronograma completo de missões."
          acao={
            <Button asChild className="system-cortes font-display uppercase tracking-[0.14em]">
              <Link to="/edital">Começar pelo edital</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const diasParaProva = concursoAtivo?.data_prova
    ? Math.max(0, Math.ceil((new Date(`${concursoAtivo.data_prova}T12:00:00`) - new Date(`${hoje}T12:00:00`)) / 86400000))
    : null;

  return (
    <div>
      <PageHeader
        titulo="Painel"
        subtitulo={concursoAtivo ? `${concursoAtivo.nome}${concursoAtivo.cargo ? ` · ${concursoAtivo.cargo}` : ''}` : ''}
        acao={
          diasParaProva !== null ? (
            <div className="system-panel system-cortes px-4 py-3 text-right">
              <p className="system-label">Prova em</p>
              <p className="font-display text-2xl font-bold text-primary">{diasParaProva} dias</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{dataBR(concursoAtivo.data_prova)}</p>
            </div>
          ) : null
        }
      />

      <div className="space-y-5">
        <HunterCard perfil={perfil} />

        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <section className="system-panel system-cortes">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <p className="system-label">Missões de hoje</p>
                <p className="font-display text-base uppercase tracking-wide text-foreground">
                  {diaSemanaCurto(hoje)} · {dataBR(hoje)}
                </p>
              </div>
              <Link to="/cronograma" className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary hover:underline">
                Ver agenda
              </Link>
            </div>

            {carregando ? (
              <p className="px-5 py-10 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Carregando missões...
              </p>
            ) : sessoes.length ? (
              <div className="divide-y divide-border/40">
                {sessoes.map((s) => (
                  <SessaoRow key={s.id} sessao={s} onConcluir={concluir} onDesfazer={desfazer} />
                ))}
              </div>
            ) : (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-muted-foreground">Nenhuma missão agendada para hoje.</p>
                <Button asChild variant="ghost" size="sm" className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                  <Link to="/cronograma">
                    Gerar cronograma <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            )}
          </section>

          <div className="space-y-5">
            <section className="system-panel system-cortes p-5">
              <p className="system-label">Próximos 7 dias</p>
              <p className="mt-1 font-display text-2xl font-bold text-foreground">{proximas}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">missões agendadas</p>
              <div className="mt-4 flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="h-4 w-4 shrink-0" />
                <span className="text-xs">
                  {dataBR(hoje)} → {dataBR(somarDias(7))}
                </span>
              </div>
            </section>

            <section className="system-panel system-cortes p-5">
              <p className="system-label">Domínio do edital</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-2xl font-bold text-primary">{topicos.dominado}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  de {topicos.total} tópicos
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full border border-border bg-secondary">
                <div
                  className="h-full bg-emerald-400 transition-all duration-700"
                  style={{ width: `${topicos.total ? Math.round((topicos.dominado / topicos.total) * 100) : 0}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="border border-border/70 bg-secondary/30 px-3 py-2">
                  <p className="font-display text-lg text-foreground">{topicos.pendente}</p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Pendentes</p>
                </div>
                <div className="border border-border/70 bg-secondary/30 px-3 py-2">
                  <p className="font-display text-lg text-foreground">{topicos.estudando}</p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Estudando</p>
                </div>
              </div>
              <Button asChild variant="ghost" size="sm" className="mt-4 w-full font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                <Link to="/edital">
                  Gerenciar edital <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
