import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const TIPOS_VALIDOS = ['teoria', 'questoes', 'revisao', 'simulado'];
const MAX_SESSOES = 220;
const MAX_TOPICOS = 300;

const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const limpar = (v: unknown, max: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const concurso = body?.concurso || {};

    const periodoDias = Math.min(30, Math.max(3, Number(body?.periodo_dias) || 14));
    const horasPorDia = Math.min(12, Math.max(0.5, Number(body?.horas_por_dia) || 3));
    const diasInformados = Array.isArray(body?.dias_semana) ? body.dias_semana.filter((d: number) => d >= 0 && d <= 6) : [];
    const diasSemana = diasInformados.length ? diasInformados : [1, 2, 3, 4, 5];
    const inicio = /^\d{4}-\d{2}-\d{2}$/.test(body?.data_inicio || '') ? body.data_inicio : fmt(new Date());

    const topicos = (Array.isArray(body?.topicos) ? body.topicos : [])
      .slice(0, MAX_TOPICOS)
      .map((t: any) => ({
        id: limpar(t?.id, 60),
        materia: limpar(t?.materia, 80) || 'Geral',
        titulo: limpar(t?.titulo, 160) || limpar(t?.materia, 80),
        peso: Math.min(5, Math.max(1, Number(t?.peso) || 3)),
        status: ['pendente', 'estudando', 'dominado'].includes(t?.status) ? t.status : 'pendente',
      }))
      .filter((t: any) => t.titulo);

    if (!topicos.length) {
      return Response.json({ error: 'Nenhum tópico cadastrado para montar o plano.' }, { status: 400 });
    }

    const base = new Date(`${inicio}T12:00:00`);
    const datas: string[] = [];
    for (let i = 0; i < periodoDias; i += 1) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      if (diasSemana.includes(d.getDay())) datas.push(fmt(d));
    }
    if (!datas.length) {
      return Response.json({ error: 'Nenhum dia de estudo disponível no período escolhido.' }, { status: 400 });
    }

    const minutosPorDia = Math.round(horasPorDia * 60);
    const listaTopicos = topicos
      .map((t: any) => `${t.id} | ${t.materia} | ${t.titulo} | peso ${t.peso} | ${t.status}`)
      .join('\n');

    const prompt = `Você é o SISTEMA, um mentor de elite que monta cronogramas de estudo para concursos públicos brasileiros, no estilo de missões diárias.

ALVO
Concurso: ${limpar(concurso.nome, 120) || 'Concurso público'}
Cargo: ${limpar(concurso.cargo, 120) || 'não informado'}
Banca: ${limpar(concurso.banca, 80) || 'não informada'}
Data da prova: ${limpar(concurso.data_prova, 10) || 'ainda não definida'}

ROTINA DISPONÍVEL
Período do plano: de ${datas[0]} a ${datas[datas.length - 1]}
Dias de estudo disponíveis (use SOMENTE estas datas, formato AAAA-MM-DD): ${datas.join(', ')}
Limite de estudo por dia: ${horasPorDia} horas (${minutosPorDia} minutos por dia, nunca ultrapasse)

TÓPICOS DO EDITAL (formato: id | matéria | tópico | peso 1-5 | status atual)
${listaTopicos}

MISSÃO
Monte o cronograma completo de estudo para todos os dias disponíveis, cobrindo o edital inteiro.

REGRAS
1. Gere sessões apenas nas datas listadas acima, com "data" exatamente no formato AAAA-MM-DD.
2. Cada dia deve somar aproximadamente ${minutosPorDia} minutos (nunca mais). Cada sessão deve ter entre 30 e 120 minutos, em múltiplos de 5.
3. Priorize tópicos de peso maior e os que estão "pendente" (ou "estudando"): eles devem aparecer mais vezes e mais cedo no período.
4. Alterne matérias dentro do mesmo dia; evite duas sessões seguidas da mesma matéria quando houver outras disponíveis.
5. Cubra todos os tópicos listados pelo menos uma vez no período. Nunca invente matérias ou tópicos fora da lista.
6. Use os tipos: "teoria" para o primeiro contato com o tópico, "questoes" para resolução de questões do tópico, "revisao" para revisão espaçada (3 a 7 dias depois) e "simulado" para uma prova completa, uma vez a cada 7 dias, com 90 a 120 minutos.
7. "materia", "titulo" e "topico_id" devem ser copiados exatamente do tópico escolhido. O "titulo" da sessão deve descrever a missão, por exemplo: "Teoria: Controle de constitucionalidade" ou "Questões: Crase".
8. No máximo ${MAX_SESSOES} sessões no total. Não repita o mesmo tópico com o mesmo tipo na mesma data.
9. Responda apenas com o JSON do schema informado, em português do Brasil, sem comentários.`;

    const schema = {
      type: 'object',
      properties: {
        sessoes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              data: { type: 'string', description: 'Data no formato AAAA-MM-DD, entre as datas disponíveis' },
              topico_id: { type: 'string', description: 'id exato do tópico do edital' },
              materia: { type: 'string' },
              titulo: { type: 'string' },
              tipo: { type: 'string', enum: TIPOS_VALIDOS },
              duracao_min: { type: 'number', description: 'duração entre 30 e 120 minutos' },
            },
            required: ['data', 'materia', 'titulo', 'tipo', 'duracao_min'],
          },
        },
      },
      required: ['sessoes'],
    };

    const resposta = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema,
    });

    let dados = resposta;
    if (typeof dados === 'string') {
      try {
        dados = JSON.parse(dados);
      } catch {
        dados = null;
      }
    }

    const idsValidos = new Set(topicos.map((t: any) => t.id));
    const sessoes: any[] = [];
    const brutas = Array.isArray(dados?.sessoes) ? dados.sessoes : [];

    for (const s of brutas) {
      const data = limpar(s?.data, 10);
      if (!datas.includes(data)) continue;
      const titulo = limpar(s?.titulo, 180);
      const materia = limpar(s?.materia, 80);
      if (!titulo || !materia) continue;
      const tipo = TIPOS_VALIDOS.includes(s?.tipo) ? s.tipo : 'teoria';
      const duracao = Math.min(120, Math.max(30, Math.round((Number(s?.duracao_min) || 60) / 5) * 5));
      const topicoId = idsValidos.has(limpar(s?.topico_id, 60)) ? limpar(s?.topico_id, 60) : '';
      sessoes.push({ data, materia, titulo, tipo, duracao_min: duracao, topico_id: topicoId });
      if (sessoes.length >= MAX_SESSOES) break;
    }

    sessoes.sort((a, b) => a.data.localeCompare(b.data));

    if (!sessoes.length) {
      return Response.json({ error: 'O Sistema não conseguiu montar o cronograma. Tente novamente.' }, { status: 502 });
    }

    return Response.json({ sessoes, dias_disponiveis: datas });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
