#!/usr/bin/env node
/**
 * Exportador de estrutura — "Sistema de Estudos" (concurso público + Solo Leveling)
 *
 * Recria toda a estrutura de diretórios e arquivos do aplicativo (.jsx, .jsonc,
 * .ts, .css, .js) em um destino, com o conteúdo atual de cada arquivo.
 *
 * Uso:
 *   node scripts/exportar-projeto.mjs                 -> gera em ./exportacao
 *   node scripts/exportar-projeto.mjs ../meu-app      -> gera em ../meu-app
 *   node scripts/exportar-projeto.mjs ../meu-app --force   -> sobrescreve o destino
 *
 * Estrutura gerada (igual à do app):
 *   src/pages/*.jsx            páginas: Painel, Edital, Agenda, Cards, Rank
 *   src/components/**          componentes por área (dashboard, concurso, cronograma, flashcards, progresso, shared, layout)
 *   src/lib/*.js               regras de XP/nível/rank, leitura de CSV, gamificação
 *   src/hooks/*.js             hooks de dados (concurso ativo + perfil)
 *   src/index.css              tema "janela do Sistema" (fontes, tokens, painéis)
 *   base44/entities/*.jsonc    esquemas do banco: Concurso, Topico, Sessao, Perfil, Flashcard
 *   base44/functions/**        função de backend gerarPlano (IA que monta o cronograma)
 *   App.jsx, main.jsx, index.html, tailwind.config.js, package.json, etc.
 */

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argumentos = process.argv.slice(2).filter((a) => a !== '--force');
const SOBRESCREVER = process.argv.includes('--force');
const DESTINO = path.resolve(RAIZ, argumentos[0] || 'exportacao');

/** Pastas copiadas integralmente (recursivo) */
const PASTAS = ['src', 'base44'];

/** Arquivos soltos na raiz do projeto que fazem parte do app/tooling */
const ARQUIVOS_RAIZ = [
  'package.json',
  'index.html',
  'vite.config.js',
  'vite.config.ts',
  'vite.config.mjs',
  'postcss.config.js',
  'postcss.config.cjs',
  'tailwind.config.js',
  'tailwind.config.cjs',
  'jsconfig.json',
  'tsconfig.json',
  'components.json',
  'eslint.config.js',
  '.npmrc',
  '.gitignore',
  'README.md',
];

const IGNORAR = new Set(['node_modules', '.git', 'dist', 'build', '.DS_Store', 'exportacao']);

const cores = {
  ok: (t) => `\x1b[36m${t}\x1b[0m`,
  bom: (t) => `\x1b[32m${t}\x1b[0m`,
  aviso: (t) => `\x1b[33m${t}\x1b[0m`,
  erro: (t) => `\x1b[31m${t}\x1b[0m`,
};

/** Lista todos os arquivos de uma pasta, em caminhos relativos à raiz */
async function listarArquivos(pastaRelativa, prefixo = pastaRelativa) {
  const absoluto = path.join(RAIZ, pastaRelativa);
  const entradas = await readdir(absoluto, { withFileTypes: true });
  const arquivos = [];

  for (const entrada of entradas) {
    if (IGNORAR.has(entrada.name)) continue;
    const relativo = path.join(prefixo, entrada.name);
    if (entrada.isDirectory()) {
      arquivos.push(...(await listarArquivos(relativo, relativo)));
    } else {
      arquivos.push(relativo);
    }
  }

  return arquivos;
}

async function copiarArquivo(relativo) {
  const conteudo = await readFile(path.join(RAIZ, relativo));
  const alvo = path.join(DESTINO, relativo);
  await mkdir(path.dirname(alvo), { recursive: true });
  await writeFile(alvo, conteudo);
  return { relativo, bytes: conteudo.length };
}

function resumoPorPasta(copiados) {
  const mapa = new Map();
  for (const { relativo } of copiados) {
    const pasta = relativo.includes(path.sep) ? relativo.split(path.sep).slice(0, 2).join('/') : 'raiz';
    mapa.set(pasta, (mapa.get(pasta) || 0) + 1);
  }
  return [...mapa.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

async function main() {
  console.log(cores.ok('\n▸ Exportador de estrutura — Sistema de Estudos'));
  console.log(`  origem:  ${RAIZ}`);
  console.log(`  destino: ${DESTINO}\n`);

  if (DESTINO === RAIZ || RAIZ.startsWith(`${DESTINO}${path.sep}`)) {
    console.error(cores.erro('✖ O destino não pode ser a própria raiz do projeto nem uma pasta acima dela.'));
    process.exit(1);
  }

  if (existsSync(DESTINO) && !SOBRESCREVER) {
    console.error(cores.erro(`✖ O destino "${DESTINO}" já existe.`));
    console.error('  Use outro caminho ou rode com --force para sobrescrever os arquivos.');
    process.exit(1);
  }

  const arquivos = [];
  for (const pasta of PASTAS) {
    if (!existsSync(path.join(RAIZ, pasta))) {
      console.warn(cores.aviso(`  ! pasta "${pasta}" não encontrada — ignorada`));
      continue;
    }
    arquivos.push(...(await listarArquivos(pasta)));
  }

  const faltando = [];
  for (const arquivo of ARQUIVOS_RAIZ) {
    if (existsSync(path.join(RAIZ, arquivo))) arquivos.push(arquivo);
    else faltando.push(arquivo);
  }

  const copiados = [];
  for (const arquivo of arquivos.sort()) {
    copiados.push(await copiarArquivo(arquivo));
  }

  const leiaMe = `# Sistema de Estudos — projeto exportado

Estrutura e código do app gerados por \`scripts/exportar-projeto.mjs\`.

- \`src/pages\` — Painel, Edital, Agenda, Cards (flashcards) e Rank
- \`src/components\` — componentes de cada área + componentes de interface (shadcn/ui)
- \`src/lib\` e \`src/hooks\` — regras de XP/nível/rank, leitura do CSV do edital e hook do concurso ativo
- \`base44/entities\` — esquemas do banco (Concurso, Topico, Sessao, Perfil, Flashcard)
- \`base44/functions/gerarPlano\` — função de backend que usa IA para montar o cronograma

## Como rodar

\`\`\`bash
npm install
npm run dev
\`\`\`

> As páginas usam o SDK da Base44 (\`@/api/base44Client\`), que existe na plataforma.
> Para rodar o app completo (login, banco de dados e IA), publique-o na Base44.
`;
  await mkdir(DESTINO, { recursive: true });
  await writeFile(path.join(DESTINO, 'LEIA-ME.md'), leiaMe, 'utf8');

  console.log(cores.bom('✔ Estrutura criada\n'));
  for (const [pasta, quantidade] of resumoPorPasta(copiados)) {
    console.log(`  ${String(quantidade).padStart(3)}  ${pasta}`);
  }
  const totalBytes = copiados.reduce((acc, a) => acc + a.bytes, 0);
  console.log(`\n  ${copiados.length} arquivos · ${(totalBytes / 1024).toFixed(1)} KB · + LEIA-ME.md`);
  if (faltando.length) {
    console.log(cores.aviso(`  (opcionais ausentes: ${faltando.join(', ')})`));
  }
  console.log(cores.ok(`\n▸ Pronto: ${DESTINO}\n`));
}

main().catch((erro) => {
  console.error(cores.erro(`✖ Falha ao exportar: ${erro.message}`));
  process.exit(1);
});
