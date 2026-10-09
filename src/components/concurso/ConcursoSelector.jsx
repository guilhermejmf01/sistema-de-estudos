import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ConcursoSelector({ concursos = [], value, onChange, className }) {
  if (!concursos.length) return null;
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className={className || 'h-10 w-full border-primary/30 bg-card/60 font-mono text-xs uppercase tracking-[0.18em] sm:w-72'}>
        <SelectValue placeholder="Selecione o concurso" />
      </SelectTrigger>
      <SelectContent>
        {concursos.map((c) => (
          <SelectItem key={c.id} value={c.id} className="font-mono text-xs uppercase tracking-[0.14em]">
            {c.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
