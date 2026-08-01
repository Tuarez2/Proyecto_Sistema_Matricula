const manejadorAsync = (manejador) => (req, res, next) => {
  Promise.resolve(manejador(req, res, next)).catch(next);
};

export default manejadorAsync;
