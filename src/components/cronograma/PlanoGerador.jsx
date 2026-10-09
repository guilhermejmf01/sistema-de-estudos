import React, { useMemo, useState } from 'react';
import { Loader2, Wand2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { xpDaSessao } from '@/lib/leveling';
import { hojeISO } from '@/lib/csv';

const DIAS = [
  { v: 0, l: 'Dom' },
  { v: 1, l: 'Seg' },
  { v: 2, l: 'Ter' },
  { v: 3, l: 'Qua' },
  { v: 4, l: 'Qui' },
  { v: 5, l: 'Sex' },
  { v: 6, l: 'Sáb' },
];

const PERIODOS = [7, 14, 30];

export default function PlanoGerador({ concurso, topicos = [], onGerado }) {
  const [periodo, setPeriodo] = useState(14);
  const [horas, setHoras] = useState(3);
  const [dias, setDias] = useState([1, 2, 3, 4, 5]);
  const [inicio, setInicio] = useState(hojeISO());
  const [gerando, setGerando] = useState(false);
  const { toast } = useToast();

  const diasDisponiveis = useMemo(() => {
    const base = new Date(`${inicio}T12:00:00`);
    let total = 0;
    for (let i = 0; i < periodo; i += 1) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      if (dias.includes(d.getDay())) total += 1;
    }
    return total;
  }, [inicio, periodo, dias]);

  const alternarDia = (v) => setDias((atual) => (atual.includes(v) ? atual.filter((d) => d !== v) : [...atual, v].sort()));

  const gerar = async () => {
    if (!topicos.length) {
      toast({ title: 'Importe os tópicos do edital primeiro', variant: 'destructive' });
      return;
    }
    if (!dias.length) {
      toast({ title: 'Escolha pelo menos um dia de estudo', variant: 'destructive' });
      return;
    }

    setGerando(true);
    try {
      const resposta = await base44.functions.invoke('gerarPlano', {
        concurso: {
          nome: concurso?.nome,
          cargo: concurso?.cargo,
          banca: concurso?.banca,
          data_prova: concurso?.data_prova,
        },
        periodo_dias: periodo,
        horas_por_dia: Number(horas) || 3,
        dias_semana: dias,
        data_inicio: inicio,
        topicos: topicos
          .slice()
          .sort((a, b) => (b.peso || 3) - (a.peso || 3))
          .slice(0, 300)
          .map((t) => ({ id: t.id, materia: t.materia, titulo: t.titulo, peso: t.peso, status: t.status })),
      });

      const sessoes = resposta.data?.sessoes || [];
      if (!sessoes.length) throw new Error(resposta.data?.error || 'Nenhuma missão gerada.');

      const registros = sessoes.map((s) => ({
        concurso_id: concurso.id,
        topico_id: s.topico_id || undefined,
        materia: s.materia,
        titulo: s.titulo,
        tipo: s.tipo,
        duracao_min: s.duracao_min,
        data: s.data,
        xp: xpDaSessao(s.duracao_min, s.tipo),
        status: 'pendente',
      }));

      for (let i = 0; i < registros.length; i += 500) {
        await base44.entities.Sessao.bulkCreate(registros.slice(i, i + 500));
      }

      toast({ title: 'Cronograma gerado pelo Sistema', description: `${registros.length} missões distribuídas.` });
      onGerado?.();
    } catch (erro) {
      toast({
        title: 'O Sistema não conseguiu gerar o plano',
        description: erro?.response?.data?.error || erro.message,
        variant: 'destructive',
      });
    } finally {
      setGerando(false);
    }
  };

  return (
    <section className="system-panel system-cortes p-5">
      <p className="system-label">Gerador de plano</p>
      <h3 className="mt-1 font-display text-lg uppercase tracking-wide text-foreground">Montar cronograma com IA</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        O Sistema distribui os tópicos do edital nas suas horas disponíveis, priorizando o que tem mais peso.
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-2">
          <Label className="system-label">Período do plano</Label>
          <div className="flex gap-2">
            {PERIODOS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriodo(p)}
                className={cn(
                  'flex-1 border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors',
                  periodo === p ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30',
                )}
              >
                {p} dias
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="horas" className="system-label">Horas por dia</Label>
            <Input
              id="horas"
              type="number"
              min="0.5"
              max="12"
              step="0.5"
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inicio" className="system-label">Início</Label>
            <Input id="inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="font-mono" />
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <Label className="system-label">Dias de estudo</Label>
        <div className="flex flex-wrap gap-2">
          {DIAS.map((d) => (
            <button
              key={d.v}
              type="button"
              onClick={() => alternarDia(d.v)}
              className={cn(
                'min-w-[52px] border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors',
                dias.includes(d.v)
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30',
              )}
            >
              {d.l}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {topicos.length} tópicos · {diasDisponiveis} dias de estudo · {Number(horas) || 0}h/dia
        </p>
        <Button onClick={gerar} disabled={gerando || !topicos.length} className="system-cortes font-display uppercase tracking-[0.14em]">
          {gerando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          {gerando ? 'Consultando o Sistema...' : 'Gerar cronograma'}
        </Button>
      </div>
    </section>
  );
}
