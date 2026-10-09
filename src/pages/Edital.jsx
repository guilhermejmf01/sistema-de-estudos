import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useEstudos from '@/hooks/useEstudos';
import ConcursoForm from '@/components/concurso/ConcursoForm';
import ConcursoSelector from '@/components/concurso/ConcursoSelector';
import CsvImport from '@/components/concurso/CsvImport';
import TopicoRow from '@/components/concurso/TopicoRow';
import PageHeader from '@/components/shared/PageHeader';
import EstadoVazio from '@/components/shared/EstadoVazio';
import { useToast } from '@/components/ui/use-toast';

export default function Edital() {
  const { concursos, concursoAtivo, loading, carregar, selecionarConcurso } = useEstudos();
  const [topicos, setTopicos] = useState([]);
  const [status, setStatus] = useState({ pendente: 0, estudando: 0, dominado: 0 });
  const [carregando, setCarregando] = useState(false);
  const [importando, setImportando] = useState(false);
  const { toast } = useToast();

  const contar = useCallback(async (concursoId) => {
    const agg = await base44.entities.Topico.aggregate({ query: { concurso_id: concursoId }, groupBy: 'status' });
    const mapa = Object.fromEntries((agg.rows || []).map((r) => [r.status, r.count || 0]));
    setStatus({ pendente: mapa.pendente || 0, estudando: mapa.estudando || 0, dominado: mapa.dominado || 0 });
  }, []);

  const carregarTopicos = useCallback(async () => {
    if (!concursoAtivo) {
      setTopicos([]);
      return;
    }
    setCarregando(true);
    const [pagina] = await Promise.all([
      base44.entities.Topico.filter({ concurso_id: concursoAtivo.id }, { sort: 'materia', limit: 500 }),
      contar(concursoAtivo.id),
    ]);
    setTopicos(pagina.items || []);
    setCarregando(false);
  }, [concursoAtivo, contar]);

  useEffect(() => {
    carregarTopicos();
  }, [carregarTopicos]);

  const grupos = useMemo(() => {
    const mapa = new Map();
    topicos.forEach((t) => {
      if (!mapa.has(t.materia)) mapa.set(t.materia, []);
      mapa.get(t.materia).push(t);
    });
    return [...mapa.entries()].map(([materia, itens]) => ({ materia, itens }));
  }, [topicos]);

  const importar = async (novos) => {
    setImportando(true);
    const registros = novos.map((t) => ({ ...t, concurso_id: concursoAtivo.id, status: 'pendente' }));
    for (let i = 0; i < registros.length; i += 500) {
      await base44.entities.Topico.bulkCreate(registros.slice(i, i + 500));
    }
    setImportando(false);
    toast({ title: `${registros.length} tópicos importados`, description: 'Gere o cronograma na Agenda.' });
    carregarTopicos();
  };

  const mudarStatus = async (topico, novo) => {
    setTopicos((prev) => prev.map((t) => (t.id === topico.id ? { ...t, status: novo } : t)));
    await base44.entities.Topico.update(topico.id, { status: novo });
    contar(concursoAtivo.id);
  };

  const excluir = async (topico) => {
    setTopicos((prev) => prev.filter((t) => t.id !== topico.id));
    await base44.entities.Topico.delete(topico.id);
    contar(concursoAtivo.id);
  };

  if (!loading && !concursos.length) {
    return (
      <div>
        <PageHeader titulo="Edital" subtitulo="Passo 1 — registre o concurso que você vai prestar." />
        <EstadoVazio
          icone={ScrollText}
          titulo="Nenhum concurso registrado"
          descricao="Cadastre o concurso para depois importar os tópicos do edital e liberar o gerador de cronograma."
          acao={<ConcursoForm onCriado={carregar} />}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        titulo="Edital"
        subtitulo={concursoAtivo ? `Tópicos do edital — ${concursoAtivo.nome}` : 'Selecione um concurso'}
        acao={
          <div className="flex flex-col gap-2 sm:flex-row">
            <ConcursoSelector concursos={concursos} value={concursoAtivo?.id} onChange={selecionarConcurso} />
            <ConcursoForm
              label="Novo"
              onCriado={async (criado) => {
                await carregar();
                await selecionarConcurso(criado.id);
              }}
            />
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <section className="system-panel system-cortes">
          <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-5 py-4">
            <span className="border border-slate-400/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-300">
              {status.pendente} pendentes
            </span>
            <span className="border border-primary/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
              {status.estudando} estudando
            </span>
            <span className="border border-emerald-400/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-300">
              {status.dominado} dominados
            </span>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {topicos.length} carregados
            </span>
          </div>

          {carregando ? (
            <p className="px-5 py-10 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Carregando tópicos...
            </p>
          ) : grupos.length ? (
            <div className="max-h-[70vh] space-y-3 overflow-y-auto p-4">
              {grupos.map((g) => (
                <div key={g.materia} className="border border-border/60">
                  <div className="flex items-center justify-between border-b border-border/60 bg-secondary/30 px-3 py-2">
                    <p className="truncate font-display text-xs uppercase tracking-[0.16em] text-primary">{g.materia}</p>
                    <p className="shrink-0 font-mono text-[10px] text-muted-foreground">{g.itens.length}</p>
                  </div>
                  {g.itens.map((t) => (
                    <TopicoRow key={t.id} topico={t} onStatus={mudarStatus} onExcluir={excluir} />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum tópico importado. Envie o CSV com as matérias e tópicos do edital.
              </p>
            </div>
          )}
        </section>

        <div className="space-y-5">
          <CsvImport onImportar={importar} importando={importando} />

          {concursoAtivo && (
            <section className="system-panel system-cortes p-5">
              <p className="system-label">Alvo</p>
              <h3 className="mt-1 font-display text-base uppercase tracking-wide text-foreground">{concursoAtivo.nome}</h3>
              <dl className="mt-3 space-y-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {concursoAtivo.cargo && (
                  <div className="flex justify-between gap-3">
                    <dt>Cargo</dt>
                    <dd className="truncate text-foreground/80">{concursoAtivo.cargo}</dd>
                  </div>
                )}
                {concursoAtivo.banca && (
                  <div className="flex justify-between gap-3">
                    <dt>Banca</dt>
                    <dd className="truncate text-foreground/80">{concursoAtivo.banca}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <dt>Prova</dt>
                  <dd className="text-foreground/80">{concursoAtivo.data_prova ? concursoAtivo.data_prova : 'a definir'}</dd>
                </div>
              </dl>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
