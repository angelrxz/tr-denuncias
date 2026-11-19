const NUCLEO_URL = process.env.NUCLEO_URL;
const M1_URL = process.env.M1_URL;

let token = null;
let expira = 0;

async function obtenerToken() {
  if (token && Date.now() < expira - 60000) {
    return token;
  }
  const respuesta = await fetch(NUCLEO_URL + '/api/nucleo/sesiones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rut: process.env.SERVICIO_RUT, clave: process.env.SERVICIO_CLAVE })
  });
  if (!respuesta.ok) {
    throw new Error('No se pudo iniciar sesión en el núcleo');
  }
  const datos = await respuesta.json();
  token = datos.token;
  expira = new Date(datos.expira).getTime();
  return token;
}

async function buscarAnimal(animalId) {
  const t = await obtenerToken();
  const respuesta = await fetch(M1_URL + '/animales/' + encodeURIComponent(animalId), {
    headers: { Authorization: 'Bearer ' + t }
  });
  if (respuesta.status === 404) {
    return null;
  }
  if (!respuesta.ok) {
    throw new Error('Error al consultar el M1');
  }
  return respuesta.json();
}

module.exports = { buscarAnimal };