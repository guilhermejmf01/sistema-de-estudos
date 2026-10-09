import React, { useState } from 'react';
import { Check, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ModoRevisao({ cartoes = [], onResponder, onFechar }) {
  const [fila, setFila] = useState(cartoes);
  const [idx, setIdx] = useState(0);
  const [revelado, setRevelado] = useState(false);
  const [sessao, setSessao] = useState({ acertos: 0, erros: 0 });
  const [errados, setErrados] = useState([]);
  const [salvando, setSalvando] = useState(false);

  const atual = fila[idx];
  const total = sessao.acertos + sessao.erros;
  const indice = total ? Math.round((sessao.acertos / total) * 100) : 0;

  const responder = async (acertou) => {
    if (!atual || salvando) return;
    setSalvando(true);
    await onResponder?.(atual, acertou);
    setSalvando(false);
    setSessao((s) => ({ acertos: s.acertos + (acertou ? 1 : 0), erros: s.erros + (acertou ? 0 : 1) }));
    if (!acertou) setErrados((e) => [...e, atual]);
    setRevelado(false);
    setIdx((i) => i + 1);
  };

  const treinarErrados = () => {
    setFila(errados);
    setErrados([]);
    setSessao({ acertos: 0, erros: 0 });
    setIdx(0);
    setRevelado(false);
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onFechar?.()}>
      <DialogContent className="system-panel system-cortes sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-[0.12em]">
            {atual ? 'Sessão de revisão' : 'Resultado da sessão'}
          </DialogTitle>
        </DialogHeader>

        {atual ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <span>Cartão {idx + 1} de {fila.length}</span>
              <span>
                <span className="text-emerald-300">{sessao.acertos} acertos</span> · <span className="text-red-300">{sessao.erros} erros</span>
              </span>
            </div>

            <div className="flex min-h-[190px] flex-col items-center justify-center gap-3 border border-primary/30 bg-secondary/20 px-6 py-8 text-center">
              <p className="system-label">{revelado ? 'Resposta' : 'Pergunta'}</p>
              <p className="text-lg leading-relaxed text-foreground">{revelado ? atual.verso : atual.frente}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{atual.materia}</p>
            </div>

            {revelado ? (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => responder(false)}
                  disabled={salvando}
                  variant="outline"
                  className="border-red-400/40 font-display uppercase tracking-[0.12em] text-red-300 hover:bg-red-400/10 hover:text-red-200"
                >
                  <X className="mr-2 h-4 w-4" />
                  Errei
                </Button>
                <Button
                  onClick={() => responder(true)}
                  disabled={salvando}
                  variant="outline"
                  className="border-emerald-400/40 font-display uppercase tracking-[0.12em] text-emerald-300 hover:bg-emerald-400/10 hover:text-emerald-200"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Acertei
                </Button>
              </div>
            ) : (
              <Button onClick={() => setRevelado(true)} className="w-full font-display uppercase tracking-[0.12em]">
                <Eye className="mr-2 h-4 w-4" />
                Mostrar resposta
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-4 text-center">
            <p className="system-label">Sessão concluída</p>
            <p className="font-display text-5xl font-bold text-primary">{indice}%</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {sessao.acertos} acertos · {sessao.erros} erros em {total} respostas
            </p>

            <div className="flex flex-col justify-center gap-2 pt-2 sm:flex-row">
              {errados.length > 0 && (
                <Button variant="outline" onClick={treinarErrados} className="font-display uppercase tracking-[0.12em]">
                  Treinar os {errados.length} que errei
                </Button>
              )}
              <Button onClick={() => onFechar?.()} className="font-display uppercase tracking-[0.12em]">
                Concluir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
