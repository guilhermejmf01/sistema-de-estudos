import React, { useRef, useState } from 'react';
import { Download, FileSpreadsheet, Upload, X } from 'lucide-react';
import { parseCsvTopicos } from '@/lib/csv';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const MODELO = 'Materia;Topico;Peso\nPortuguês;Crase;4\nDireito Constitucional;Controle de constitucionalidade;5\nRaciocínio Lógico;Proposições equivalentes;3\n';

export default function CsvImport({ onImportar, importando }) {
  const [topicos, setTopicos] = useState([]);
  const [arquivo, setArquivo] = useState('');
  const [lendo, setLendo] = useState(false);
  const inputRef = useRef(null);
  const { toast } = useToast();

  const lerArquivo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLendo(true);
    const texto = await file.text();
    const lidos = parseCsvTopicos(texto);
    setLendo(false);
    setArquivo(file.name);
    setTopicos(lidos);
    if (!lidos.length) {
      toast({ title: 'Não encontrei tópicos nesse arquivo', description: 'Use colunas: Matéria, Tópico e Peso (opcional).', variant: 'destructive' });
    }
  };

  const limpar = () => {
    setTopicos([]);
    setArquivo('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const confirmar = async () => {
    await onImportar(topicos);
    limpar();
  };

  const baixarModelo = () => {
    const blob = new Blob([MODELO], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo-edital.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="system-panel system-cortes p-5">
      <p className="system-label">Importar edital</p>
      <h3 className="mt-1 font-display text-lg uppercase tracking-wide text-foreground">Arquivo CSV dos tópicos</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Colunas esperadas: <span className="font-mono text-[11px] text-primary/80">Matéria; Tópico; Peso</span> — o peso (1 a 5) ajuda a IA a priorizar.
      </p>

      {!topicos.length ? (
        <div className="mt-4 space-y-3">
          <label
            htmlFor="csv-edital"
            className="flex cursor-pointer flex-col items-center gap-2 border border-dashed border-border bg-secondary/20 px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-secondary/40"
          >
            <Upload className="h-5 w-5 text-primary" />
            <span className="font-display text-sm uppercase tracking-[0.14em] text-foreground">
              {lendo ? 'Lendo arquivo...' : 'Selecionar CSV'}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              .csv — também aceita separado por vírgula
            </span>
            <input id="csv-edital" ref={inputRef} type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={lerArquivo} />
          </label>
          <Button variant="ghost" size="sm" onClick={baixarModelo} className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <Download className="mr-2 h-3.5 w-3.5" />
            Baixar modelo
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2 border border-border bg-secondary/30 px-3 py-2">
            <FileSpreadsheet className="h-4 w-4 shrink-0 text-primary" />
            <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-foreground">{arquivo}</span>
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">{topicos.length} tópicos</span>
          </div>

          <div className="max-h-52 overflow-y-auto border border-border/70">
            {topicos.slice(0, 40).map((t, i) => (
              <div key={`${t.materia}-${t.titulo}-${i}`} className="flex items-center gap-2 border-b border-border/40 px-3 py-2 last:border-b-0">
                <span className="min-w-0 flex-1 truncate text-xs text-foreground/90">{t.titulo}</span>
                <span className="max-w-[45%] shrink-0 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{t.materia}</span>
                <span className="shrink-0 font-mono text-[10px] text-primary/80">P{t.peso}</span>
              </div>
            ))}
            {topicos.length > 40 && (
              <p className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                + {topicos.length - 40} tópicos
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={confirmar} disabled={importando} className="flex-1 font-display uppercase tracking-[0.12em]">
              {importando ? 'Importando...' : `Importar ${topicos.length}`}
            </Button>
            <Button variant="ghost" onClick={limpar} className="font-display uppercase tracking-[0.12em]">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
