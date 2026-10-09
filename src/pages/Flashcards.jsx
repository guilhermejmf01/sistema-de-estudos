import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Play, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useEstudos from '@/hooks/useEstudos';
import ConcursoSelector from '@/components/concurso/ConcursoSelector';
import FlashcardForm from '@/components/flashcards/FlashcardForm';
import FlashcardRow from '@/components/flashcards/FlashcardRow';
import IndiceAcerto from '@/components/flashcards/IndiceAcerto';
import ModoRevisao from '@/components/flashcards/ModoRevisao';
import PageHeader from '@/components/shared/PageHeader';
import EstadoVazio from '@/components/shared/EstadoVazio';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const FILTROS = [
  { v: 'todos', l: 'Todos' },
  { v: 'novos', l: 'Novos' },
  { v: 'revisar', l: 'Revisar' },
  { v: 'dominados', l: 'Dominados' },
];

const indiceDoCartao = (c) => {
  const total = (c.acertos || 0) + (c.erros || 0);
  return total ? Math.round(((c.acertos || 0) / total) * 100) : null;
};

export default function Flashcards() {
  const { concursos, concursoAtivo, loading, carregar, selecionarConcurso } = useEstudos();
  const [cartoes, setCartoes] = useState([]);
  const [linhas, setLinhas] = useState([]);
  const [geral, setGeral] = useState({ indice: null, respostas: 0, acertos: 0, erros: 0 });
  const [filtro, setFiltro] = useState('todos');
  const [carregando, setCarregando] = useState(false);
  const [formAberto, setFormAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState(null);
  const [sessao, setSessao] = useState(null);

  const cartoesRef = useRef([]);
  useEffect(() => {
    cartoesRef.current = cartoes;
  }, [cartoes]);

  const carregarIndice = useCallback(async (concursoId) => {
    const agg = await base44.entities.Flashcard.aggregate({
      query: { concurso_id: concursoId },
      groupBy: 'materia',
      sum: ['acertos', 'erros'],
    });
    const calculadas = (agg.rows || [])
      .map((r) => {
        const acertos = r.sum_acertos || 0;
        const erros = r.sum_erros || 0;
        const total = acertos + erros;
        return {
          materia: r.materia || 'Sem matéria',
          cartoes: r.count || 0,
          acertos,
          erros,
          total,
          indice: total ? Math.round((acertos / total) * 100) : 0,
        };
      })
      .sort((a, b) => b.total - a.total);

    setLinhas(calculadas);
    const acertos = calculadas.reduce((acc, l) => acc + l.acertos, 0);
    const erros = calculadas.reduce((acc, l) => acc + l.erros, 0);
    const respostas = acertos + erros;
    setGeral({ indice: respostas ? Math.round((acertos / respostas) * 100) : null, respostas, acertos, erros });
  }, []);

  const carregarCartoes = useCallback(async () => {
    if (!concursoAtivo) {
      setCartoes([]);
      setLinhas([]);
      setGeral({ indice: null, respostas: 0, acertos: 0, erros: 0 });
      return;
    }
    setCarregando(true);
    const [pagina] = await Promise.all([
      base44.entities.Flashcard.filter({ concurso_id: concursoAtivo.id }, { sort: '-created_date', limit: 200 }),
      carregarIndice(concursoAtivo.id),
    ]);
    setCartoes(pagina.items || []);
    setCarregando(false);
  }, [concursoAtivo, carregarIndice]);

  useEffect(() => {
    carregarCartoes();
  }, [carregarCartoes]);

  const filtrados = useMemo(() => {
    if (filtro === 'novos') return cartoes.filter((c) => !(c.acertos || 0) && !(c.erros || 0));
    if (filtro === 'revisar') return cartoes.filter((c) => { const i = indiceDoCartao(c); return i !== null && i < 70; });
    if (filtro === 'dominados') return cartoes.filter((c) => { const i = indiceDoCartao(c); return i !== null && i >= 80; });
    return cartoes;
  }, [cartoes, filtro]);

  const criticos = useMemo(() => cartoes.filter((c) => { const i = indiceDoCartao(c); return i !== null && i < 50; }).length, [cartoes]);

  const responder = async (cartao, acertou) => {
    const atual = cartoesRef.current.find((c) => c.id === cartao.id) || cartao;
    const acertos = (atual.acertos || 0) + (acertou ? 1 : 0);
    const erros = (atual.erros || 0) + (acertou ? 0 : 1);
    await base44.entities.Flashcard.update(cartao.id, { acertos, erros, ultima_revisao: new Date().toISOString() });
    setCartoes((prev) => prev.map((c) => (c.id === cartao.id ? { ...c, acertos, erros } : c)));
  };

  const fecharRevisao = () => {
    setSessao(null);
    if (concursoAtivo) carregarIndice(concursoAtivo.id);
  };

  const excluir = async (cartao) => {
    setCartoes((prev) => prev.filter((c) => c.id !== cartao.id));
    await base44.entities.Flashcard.delete(cartao.id);
    if (concursoAtivo) carregarIndice(concursoAtivo.id);
  };

  const abrirCriacao = () => {
    setEmEdicao(null);
    setFormAberto(true);
  };

  const abrirEdicao = (cartao) => {
    setEmEdicao(cartao);
    setFormAberto(true);
  };

  if (!loading && !concursos.length) {
    return (
      <div>
        <PageHeader titulo="Cards" subtitulo="Passo 1 — registre o concurso que você vai prestar." />
        <EstadoVazio
          icone={Layers}
          titulo="Nenhum concurso no Sistema"
          descricao="Registre o concurso e importe o edital para cadastrar flashcards dos tópicos e medir seu índice de acerto."
          acao={
            <Button asChild className="system-cortes font-display uppercase tracking-[0.14em]">
              <Link to="/edital">Ir para o edital</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const tiles = [
    { label: 'Índice de acerto', valor: geral.indice === null ? '—' : `${geral.indice}%`, destaque: true },
    { label: 'Cartões', valor: cartoes.length },
    { label: 'Respostas', valor: geral.respostas },
    { label: 'Precisam de atenção', valor: criticos },
  ];

  return (
    <div>
      <PageHeader
        titulo="Cards"
        subtitulo={concursoAtivo ? `Flashcards dos tópicos — ${concursoAtivo.nome}` : 'Selecione um concurso'}
        acao={<ConcursoSelector concursos={concursos} value={concursoAtivo?.id} onChange={selecionarConcurso} />}
      />

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map((t) => (
            <div key={t.label} className="system-panel system-cortes px-4 py-4 text-center">
              <p className={cn('font-display text-2xl font-bold', t.destaque ? 'text-primary' : 'text-foreground')}>{t.valor}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{t.label}</p>
            </div>
          ))}
        </div>

        <IndiceAcerto geral={geral} linhas={linhas} />

        <section className="system-panel system-cortes">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
            <div>
              <p className="system-label">Meus flashcards</p>
              <p className="font-display text-base uppercase tracking-wide text-foreground">
                {filtrados.length} cartões {filtro !== 'todos' ? `em "${FILTROS.find((f) => f.v === filtro).l}"` : ''}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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

              <Button
                onClick={() => setSessao(filtrados)}
                disabled={!filtrados.length}
                variant="outline"
                className="font-display uppercase tracking-[0.12em]"
              >
                <Play className="mr-2 h-4 w-4" />
                Revisar
              </Button>

              <Button onClick={abrirCriacao} className="font-display uppercase tracking-[0.12em]">
                <Plus className="mr-2 h-4 w-4" />
                Novo card
              </Button>
            </div>
          </div>

          {carregando ? (
            <p className="px-5 py-12 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Carregando flashcards...
            </p>
          ) : filtrados.length ? (
            <div className="max-h-[65vh] overflow-y-auto">
              {filtrados.map((c) => (
                <FlashcardRow key={c.id} cartao={c} onEditar={abrirEdicao} onExcluir={excluir} />
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {cartoes.length ? 'Nenhum cartão com esse filtro.' : 'Nenhum flashcard ainda — crie o primeiro para começar a medir seu índice de acerto.'}
              </p>
              {!cartoes.length && (
                <Button onClick={abrirCriacao} variant="ghost" size="sm" className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                  <Plus className="mr-1 h-3 w-3" />
                  Criar flashcard
                </Button>
              )}
            </div>
          )}
        </section>
      </div>

      {concursoAtivo && (
        <FlashcardForm
          concurso={concursoAtivo}
          flashcard={emEdicao}
          aberto={formAberto}
          onOpenChange={setFormAberto}
          onSalvo={carregarCartoes}
        />
      )}

      {sessao && <ModoRevisao cartoes={sessao} onResponder={responder} onFechar={fecharRevisao} />}
    </div>
  );
}
