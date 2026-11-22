function enviarError(res, status, codigo, mensaje) {
  return res.status(status).json({ error: { codigo, mensaje } });
}

async function validarToken(req, res, next) {
  const cabecera = req.headers.authorization || '';

  // Sin token → 401
  if (!cabecera.startsWith('Bearer ')) {
    return enviarError(res, 401, 'TOKEN_REQUERIDO', 'Falta el encabezado Authorization: Bearer <token>');
  }

  let respuesta;
  try {
    respuesta = await fetch(process.env.NUCLEO_URL + '/api/nucleo/sesiones/actual', {
      headers: { Authorization: cabecera },
    });
  } catch (e) {
    return enviarError(res, 503, 'NUCLEO_NO_DISPONIBLE', 'No se pudo validar la sesión');
  }

  // El núcleo dice que el token no sirve → 401
  if (!respuesta.ok) {
    return enviarError(res, 401, 'TOKEN_INVALIDO', 'El token no es válido o expiró');
  }

  const datos = await respuesta.json();

  // Queda disponible para todas las rutas
  req.usuario = { rut: datos.rut, perfil: datos.perfil };
  next();
}

// Bloquea a los perfiles que no corresponden
function exigirPerfil(...perfilesPermitidos) {
  return (req, res, next) => {
    if (!perfilesPermitidos.includes(req.usuario.perfil)) {
      return enviarError(res, 403, 'PERFIL_NO_AUTORIZADO', 'Tu perfil no puede realizar esta acción');
    }
    next();
  };
}

module.exports = { validarToken, exigirPerfil, enviarError };