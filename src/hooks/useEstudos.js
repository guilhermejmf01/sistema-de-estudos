import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { carregarPerfil, definirConcursoAtivo } from '@/lib/gamificacao';

/** Carrega o perfil do caçador e a lista de concursos, mantendo o concurso ativo */
export default function useEstudos() {
  const [concursos, setConcursos] = useState([]);
  const [concursoAtivo, setConcursoAtivo] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    const [perfilCarregado, pagina] = await Promise.all([
      carregarPerfil(),
      base44.entities.Concurso.filter({}, { sort: '-created_date', limit: 50 }),
    ]);
    const lista = pagina.items || [];
    setPerfil(perfilCarregado);
    setConcursos(lista);
    setConcursoAtivo(lista.find((c) => c.id === perfilCarregado.concurso_ativo_id) || lista[0] || null);
    setLoading(false);
    return { perfil: perfilCarregado, concursos: lista };
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const selecionarConcurso = async (id) => {
    setConcursoAtivo(concursos.find((c) => c.id === id) || null);
    const perfilAtual = perfil || (await carregarPerfil());
    await definirConcursoAtivo(perfilAtual, id);
    setPerfil({ ...perfilAtual, concurso_ativo_id: id });
  };

  return { concursos, concursoAtivo, perfil, setPerfil, loading, carregar, selecionarConcurso };
}
