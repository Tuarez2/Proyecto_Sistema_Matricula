export const construirLimiteInicioDia = (fecha) => new Date(`${fecha}T00:00:00.000Z`);

export const construirLimiteFinDia = (fecha) => new Date(`${fecha}T23:59:59.999Z`);

export default {
  construirLimiteInicioDia,
  construirLimiteFinDia
};
