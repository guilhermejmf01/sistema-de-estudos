import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

export default function ConcursoForm({ onCriado, label = 'Registrar concurso' }) {
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ nome: '', cargo: '', banca: '', data_prova: '' });
  const { toast } = useToast();

  const alterar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const salvar = async () => {
    if (!form.nome.trim()) {
      toast({ title: 'Informe o nome do concurso', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    const criado = await base44.entities.Concurso.create({
      nome: form.nome.trim(),
      cargo: form.cargo.trim(),
      banca: form.banca.trim(),
      data_prova: form.data_prova || undefined,
      status: 'ativo',
    });
    setSalvando(false);
    setAberto(false);
    setForm({ nome: '', cargo: '', banca: '', data_prova: '' });
    toast({ title: 'Concurso registrado', description: criado.nome });
    onCriado?.(criado);
  };

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button className="system-cortes w-full font-display uppercase tracking-[0.14em] sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="system-panel system-cortes sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-[0.12em]">Novo concurso</DialogTitle>
          <DialogDescription>Os dados definem o alvo do seu plano de estudos.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="nome" className="system-label">Concurso</Label>
            <Input id="nome" value={form.nome} onChange={alterar('nome')} placeholder="Ex.: TRF 6ª Região" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cargo" className="system-label">Cargo</Label>
              <Input id="cargo" value={form.cargo} onChange={alterar('cargo')} placeholder="Ex.: Técnico Judiciário" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banca" className="system-label">Banca</Label>
              <Input id="banca" value={form.banca} onChange={alterar('banca')} placeholder="Ex.: FCC" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="data_prova" className="system-label">Data da prova</Label>
            <Input id="data_prova" type="date" value={form.data_prova} onChange={alterar('data_prova')} />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setAberto(false)} className="font-display uppercase tracking-[0.12em]">
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando} className="font-display uppercase tracking-[0.12em]">
            {salvando ? 'Registrando...' : 'Registrar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
