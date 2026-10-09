import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const SEM_TOPICO = '__geral';

export default function FlashcardForm({ concurso, flashcard, aberto, onOpenChange, onSalvo }) {
  const [materias, setMaterias] = useState([]);
  const [topicos, setTopicos] = useState([]);
  const [form, setForm] = useState({ materia: '', topico_id: SEM_TOPICO, frente: '', verso: '' });
  const [salvando, setSalvando] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!aberto || !concurso) return;
    base44.entities.Topico.filter({ concurso_id: concurso.id }, { distinct: 'materia' }).then((pagina) => {
      setMaterias(pagina.items || []);
    });
  }, [aberto, concurso]);

  useEffect(() => {
    if (!aberto) return;
    if (flashcard) {
      setForm({
        materia: flashcard.materia || '',
        topico_id: flashcard.topico_id || SEM_TOPICO,
        frente: flashcard.frente || '',
        verso: flashcard.verso || '',
      });
    } else {
      setForm({ materia: '', topico_id: SEM_TOPICO, frente: '', verso: '' });
    }
  }, [aberto, flashcard]);

  useEffect(() => {
    if (!aberto || !concurso || !form.materia) {
      setTopicos([]);
      return;
    }
    base44.entities.Topico.filter({ concurso_id: concurso.id, materia: form.materia }, { sort: 'titulo', limit: 300 }).then((pagina) => {
      setTopicos(pagina.items || []);
    });
  }, [aberto, concurso, form.materia]);

  const salvar = async () => {
    if (!form.materia || !form.frente.trim() || !form.verso.trim()) {
      toast({ title: 'Preencha a matéria, a frente e o verso', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    const dados = {
      concurso_id: concurso.id,
      materia: form.materia,
      topico_id: form.topico_id === SEM_TOPICO ? undefined : form.topico_id,
      frente: form.frente.trim(),
      verso: form.verso.trim(),
    };
    const salvo = flashcard
      ? await base44.entities.Flashcard.update(flashcard.id, dados)
      : await base44.entities.Flashcard.create({ ...dados, acertos: 0, erros: 0 });
    setSalvando(false);
    onOpenChange(false);
    toast({ title: flashcard ? 'Flashcard atualizado' : 'Flashcard criado' });
    onSalvo?.(salvo);
  };

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="system-panel system-cortes sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-[0.12em]">
            {flashcard ? 'Editar flashcard' : 'Novo flashcard'}
          </DialogTitle>
          <DialogDescription>Vincule o cartão a um tópico do edital para medir seu índice de acerto por matéria.</DialogDescription>
        </DialogHeader>

        {!materias.length ? (
          <div className="border border-dashed border-border bg-secondary/20 px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">Importe os tópicos do edital primeiro para escolher a matéria.</p>
            <Button asChild variant="ghost" size="sm" className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
              <Link to="/edital">Ir para o edital</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="system-label">Matéria</Label>
                <Select value={form.materia || undefined} onValueChange={(v) => setForm((f) => ({ ...f, materia: v, topico_id: SEM_TOPICO }))}>
                  <SelectTrigger className="border-border bg-card/60 font-mono text-[11px] uppercase tracking-[0.14em]">
                    <SelectValue placeholder="Escolha a matéria" />
                  </SelectTrigger>
                  <SelectContent>
                    {materias.map((m) => (
                      <SelectItem key={m} value={m} className="font-mono text-xs uppercase tracking-[0.12em]">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="system-label">Tópico</Label>
                <Select
                  value={form.topico_id}
                  onValueChange={(v) => setForm((f) => ({ ...f, topico_id: v }))}
                  disabled={!form.materia}
                >
                  <SelectTrigger className="border-border bg-card/60 font-mono text-[11px] uppercase tracking-[0.14em]">
                    <SelectValue placeholder="Toda a matéria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_TOPICO} className="font-mono text-xs uppercase tracking-[0.12em]">
                      Toda a matéria
                    </SelectItem>
                    {topicos.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="font-mono text-xs">
                        {t.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="system-label">Frente (pergunta)</Label>
              <Textarea
                value={form.frente}
                onChange={(e) => setForm((f) => ({ ...f, frente: e.target.value }))}
                placeholder="Ex.: Qual prazo para a administração revisar seus próprios atos?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="system-label">Verso (resposta)</Label>
              <Textarea
                value={form.verso}
                onChange={(e) => setForm((f) => ({ ...f, verso: e.target.value }))}
                placeholder="Ex.: 5 anos para anular atos que geram efeitos favoráveis (art. 54 da Lei 9.784/99)"
                rows={3}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-display uppercase tracking-[0.12em]">
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando || !materias.length} className="font-display uppercase tracking-[0.12em]">
            {salvando ? 'Salvando...' : flashcard ? 'Salvar' : 'Criar flashcard'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
