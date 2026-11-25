const token = sessionStorage.getItem('token');
// antes de permitir el ingreso al formulario de denuncia, se valida que exista un token en sessionStorage, si no existe se redirige a index.html (ley 21.459)
if (!token) {
  window.location.href = 'index.html';
}

document.getElementById('saludo').textContent = 'Vecino/a: ' + sessionStorage.getItem('nombre');

document.getElementById('formDenuncia').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const mensaje = document.getElementById('mensaje');

  const denuncia = {
    tipo: document.getElementById('tipo').value,
    animalId: document.getElementById('animalId').value.trim(),
    descripcion: document.getElementById('descripcion').value.trim(),
    ubicacion: document.getElementById('ubicacion').value.trim()
  };
  const microchip = document.getElementById('microchip').value.trim();
  if (microchip) {
    denuncia.microchip = microchip;
  }

  mensaje.textContent = 'Enviando...';

  try {
    const respuesta = await fetch('/api/denuncias/denuncias', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(denuncia)
    });
    const datos = await respuesta.json();

// Cuando el backend responde HTTP 401. Cómo: Limpia sessionStorage (sessionStorage.clear()) y corta el acceso, 
// evitando que credenciales caducadas o manipuladas traspasen la seguridad que implementamos (Ley 21.459)
// esto es correlativo a la linea 65 -73 del archivo funcionario.js, donde se valida el token y el perfil del usuario
    if (respuesta.status === 401) {
      sessionStorage.clear();
      window.location.href = 'index.html';
      return;
    }

    if (!respuesta.ok) {
      mensaje.textContent = datos.error.mensaje;
      return;
    }

    mensaje.textContent = 'Denuncia registrada con N° ' + datos._id + '. Estado: ' + datos.estado;
    document.getElementById('formDenuncia').reset();
  } catch (e) {
    mensaje.textContent = 'No se pudo conectar con el servidor';
  }
});

document.getElementById('btnSalir').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'index.html';
});