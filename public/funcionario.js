const token = sessionStorage.getItem('token');
const perfil = sessionStorage.getItem('perfil');

if (!token || perfil !== 'funcionario') {
  window.location.href = 'index.html';
}
// linea 1-6 ley 21.459 (previene acceso ilicito a sistemas informaticos)- ley 21.719 (garantiza el principio de seguridad y confidencialidad)
//al cargar el panel de gestion re dirige a index.html y obviamente falta el token entonces el perfil no es funcionario
document.getElementById('saludo').textContent = 'Funcionario/a: ' + sessionStorage.getItem('nombre');

const listaDenuncias = document.getElementById('listaDenuncias');
const mensaje = document.getElementById('mensaje');
const checkboxesEstado = document.querySelectorAll('input[name="estado"]');

const modalCierre = document.getElementById('modalCierre');
const infoDenunciaModal = document.getElementById('infoDenunciaModal');
const formCerrar = document.getElementById('formCerrar');
const inputObservaciones = document.getElementById('observaciones');
const contadorCaracteres = document.getElementById('contadorCaracteres');
const mensajeModal = document.getElementById('mensajeModal');

let denunciaSeleccionadaId = null;

// Contador en vivo hasta 500 caracteres (RN-08)
inputObservaciones.addEventListener('input', () => {
  contadorCaracteres.textContent = `${inputObservaciones.value.length} / 500 caracteres`;
});

function abrirModalCierre(denuncia) {
  denunciaSeleccionadaId = denuncia._id;
  infoDenunciaModal.textContent = `Denuncia N° ${denuncia._id} (${denuncia.tipo} - Animal: ${denuncia.animalId})`;
  inputObservaciones.value = '';
  contadorCaracteres.textContent = '0 / 500 caracteres';
  mensajeModal.textContent = '';
  modalCierre.classList.remove('oculto');
}

document.getElementById('btnCancelarModal').addEventListener('click', () => {
  denunciaSeleccionadaId = null;
  modalCierre.classList.add('oculto');
});

async function cargarDenuncias() {
  mensaje.textContent = 'Cargando denuncias...';
  listaDenuncias.innerHTML = '';

  const seleccionados = Array.from(checkboxesEstado)
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);

  if (seleccionados.length === 0) {
    mensaje.textContent = 'Marca al menos un ticket de estado para ver denuncias.';
    return;
  }

  const url = seleccionados.length === 1
    ? `/api/denuncias/denuncias?estado=${encodeURIComponent(seleccionados[0])}`
    : '/api/denuncias/denuncias?limit=100';

  try {
    const respuesta = await fetch(url, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const datos = await respuesta.json();
// Cuando el backend responde HTTP 401. Cómo: Limpia sessionStorage (sessionStorage.clear()) y corta el acceso, 
// evitando que credenciales caducadas o manipuladas traspasen la seguridad que implementamos (Ley 21.459)
// esto es correlativo a la linea 40 - 45 del archivo funcionario.js, donde se valida el token y el perfil del usuario
    if (respuesta.status === 401) {
      sessionStorage.clear();
      window.location.href = 'index.html';
      return;
    }


    // renderizado con textContent y createElement para evitar inyección de código malicioso (Ley 21.459)
    if (!respuesta.ok) {
      mensaje.textContent = datos.error ? datos.error.mensaje : 'Error al cargar denuncias';
      return;
    }

    const denuncias = (datos.datos || []).filter((d) => seleccionados.includes(d.estado));
    mensaje.textContent = denuncias.length === 0 ? 'No hay denuncias en los estados seleccionados.' : '';

    denuncias.forEach((d) => {
      const tarjeta = document.createElement('div');
      tarjeta.className = 'item-denuncia';

      const pEstado = document.createElement('p');
      const badge = document.createElement('span');
      badge.className = 'badge' + (d.estado === 'cerrada' ? ' cerrada' : '');
      badge.textContent = d.estado.toUpperCase();
      pEstado.appendChild(badge);

      const pTitulo = document.createElement('p');
      pTitulo.textContent = `N° ${d._id} | Tipo: ${d.tipo} | Animal: ${d.animalId}`;

      const pDesc = document.createElement('p');
      pDesc.textContent = `Descripción: ${d.descripcion}`;

      const pUbic = document.createElement('p');
      pUbic.textContent = `Ubicación: ${d.ubicacion}`;

      tarjeta.append(pEstado, pTitulo, pDesc, pUbic);

      if (d.observaciones) {
        const pObs = document.createElement('p');
        pObs.textContent = `Observaciones de cierre: ${d.observaciones}`;
        tarjeta.appendChild(pObs);
      }

      if (d.estado === 'en_terreno' || d.estado === 'resuelta') {
        const btnCerrar = document.createElement('button');
        btnCerrar.type = 'button';
        btnCerrar.className = 'btn-chico';
        btnCerrar.textContent = 'Cerrar denuncia';
        btnCerrar.addEventListener('click', () => abrirModalCierre(d));
        tarjeta.appendChild(btnCerrar);
      }

      if (d.estado === 'asignada') {
        const btnTerreno = document.createElement('button');
        btnTerreno.type = 'button';
        btnTerreno.className = 'btn-chico';
        btnTerreno.textContent = 'Iniciar trabajo en terreno';
        btnTerreno.addEventListener('click', () => enviarATerreno(d._id));
        tarjeta.appendChild(btnTerreno);
      }

      listaDenuncias.appendChild(tarjeta);
    });
  } catch (e) {
    mensaje.textContent = 'No se pudo conectar con el servidor';
  }
}

async function enviarATerreno(id) {
  mensaje.textContent = 'Actualizando estado de la denuncia...';

  try {
    const respuesta = await fetch(`/api/denuncias/denuncias/${id}/terreno`, {
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const datos = await respuesta.json();

    if (respuesta.status === 401) {
      sessionStorage.clear();
      window.location.href = 'index.html';
      return;
    }

    if (!respuesta.ok) {
      mensaje.textContent = datos.error ? datos.error.mensaje : 'No se pudo enviar la denuncia a terreno';
      return;
    }

    await cargarDenuncias();
    mensaje.textContent = `Denuncia N° ${datos._id} enviada a terreno correctamente.`;
  } catch (e) {
    mensaje.textContent = 'No se pudo conectar con el servidor';
  }
}

formCerrar.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (!denunciaSeleccionadaId) return;

  const observaciones = inputObservaciones.value.trim();
  if (!observaciones) {
    mensajeModal.textContent = 'Debes ingresar una observación para cerrar la denuncia.';
    return;
  }

  mensajeModal.textContent = 'Cerrando denuncia...';

  try {
    const respuesta = await fetch(`/api/denuncias/denuncias/${denunciaSeleccionadaId}/cerrar`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ observaciones })
    });
    const datos = await respuesta.json();

    if (respuesta.status === 401) {
      sessionStorage.clear();
      window.location.href = 'index.html';
      return;
    }

    if (!respuesta.ok) {
      mensajeModal.textContent = datos.error ? datos.error.mensaje : 'No se pudo cerrar la denuncia';
      return;
    }

    modalCierre.classList.add('oculto');
    mensaje.textContent = `Denuncia N° ${datos._id} cerrada correctamente.`;
    cargarDenuncias();
  } catch (e) {
    mensajeModal.textContent = 'Error de conexión al cerrar la denuncia';
  }
});

checkboxesEstado.forEach((cb) => cb.addEventListener('change', cargarDenuncias));

document.getElementById('btnSalir').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'index.html';
});

cargarDenuncias();