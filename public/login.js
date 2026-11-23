const NUCLEO_URL = 'https://nucleo-tr.onrender.com';

document.getElementById('formLogin').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const mensaje = document.getElementById('mensaje');
  const rut = document.getElementById('rut').value.trim();
  const clave = document.getElementById('clave').value;

  mensaje.textContent = 'Ingresando...';

  try {
    const respuesta = await fetch(NUCLEO_URL + '/api/nucleo/sesiones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rut, clave })
    });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      mensaje.textContent = datos.error ? datos.error.mensaje : 'No se pudo iniciar sesión';
      return;
    }

    sessionStorage.setItem('token', datos.token);
    sessionStorage.setItem('nombre', datos.nombre);
    sessionStorage.setItem('perfil', datos.perfil);

// actualice el login para redirigir a la página correspondiente según el perfil del usuario --martin    
    if (datos.perfil === 'vecino') {
      window.location.href = 'denuncia.html';
    } else if (datos.perfil === 'funcionario') {
      window.location.href = 'funcionario.html';
    } else {
      mensaje.textContent = 'Bienvenido/a ' + datos.nombre + ' (' + datos.perfil + ')';
    }
  } catch (e) {
    mensaje.textContent = 'No se pudo conectar con el sistema municipal';
  }
});