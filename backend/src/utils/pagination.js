const PAGINA_PREDETERMINADA = 1;
const LIMITE_PREDETERMINADO = 10;
const LIMITE_MAXIMO = 100;

export const normalizarPaginacion = (page, limit) => {
  const paginaNormalizada = Math.max(Number(page) || PAGINA_PREDETERMINADA, 1);
  const limiteNormalizado = Math.min(Math.max(Number(limit) || LIMITE_PREDETERMINADO, 1), LIMITE_MAXIMO);

  return {
    page: paginaNormalizada,
    limit: limiteNormalizado,
    offset: (paginaNormalizada - 1) * limiteNormalizado
  };
};

export default normalizarPaginacion;
