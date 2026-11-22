const token = sessionStorage.getItem('token');

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