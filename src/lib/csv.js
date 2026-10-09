const RE_MATERIA = /materia|matéria|disciplina|area|área/;
const RE_TITULO = /topico|tópico|assunto|tema|conteudo|conteúdo|item/;
const RE_PESO = /peso|prioridade|importancia|importância|nivel|nível|nota/;

const normalizarPeso = (valor) => {
  const n = parseFloat(String(valor || '').replace(',', '.'));
  if (isNaN(n)) return 3;
  return Math.min(5, Math.max(1, Math.round(n)));
};

/** Lê o CSV do edital e devolve [{ materia, titulo, peso }] */
export function parseCsvTopicos(texto = '') {
  const linhas = String(texto)
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (!linhas.length) return [];

  const primeira = linhas[0];
  const delim = (primeira.match(/;/g) || []).length >= (primeira.match(/,/g) || []).length ? ';' : ',';
  const dividir = (linha) =>
    linha.split(delim).map((c) => c.trim().replace(/^"(.*)"$/, '$1').trim());

  const cabecalho = dividir(primeira).map((c) => c.toLowerCase());
  const temCabecalho = cabecalho.some((c) => RE_MATERIA.test(c) || RE_TITULO.test(c) || RE_PESO.test(c));

  let idxMateria = 0;
  let idxTitulo = 1;
  let idxPeso = -1;
  let inicio = 0;

  if (temCabecalho) {
    const achar = (re, fallback) => {
      const i = cabecalho.findIndex((c) => re.test(c));
      return i >= 0 ? i : fallback;
    };
    idxMateria = achar(RE_MATERIA, 0);
    idxTitulo = achar(RE_TITULO, 1);
    idxPeso = achar(RE_PESO, -1);
    inicio = 1;
  }

  const vistos = new Set();
  const topicos = [];

  for (let i = inicio; i < linhas.length; i += 1) {
    const colunas = dividir(linhas[i]);
    const materia = (colunas[idxMateria] || '').trim() || 'Geral';
    const titulo = (colunas[idxTitulo] || '').trim() || materia;
    const chave = `${materia.toLowerCase()}::${titulo.toLowerCase()}`;
    if (vistos.has(chave) || (!materia && !titulo)) continue;
    vistos.add(chave);
    topicos.push({
      materia: materia.slice(0, 80),
      titulo: titulo.slice(0, 160),
      peso: idxPeso >= 0 ? normalizarPeso(colunas[idxPeso]) : 3,
    });
  }

  return topicos;
}

export const hojeISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const somarDias = (dias = 0, base = new Date()) => {
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const dataBR = (iso) => {
  if (!iso) return '';
  const [a, m, d] = String(iso).slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
};

export const diaSemanaCurto = (iso) => {
  if (!iso) return '';
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  return ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'][d.getDay()];
};
