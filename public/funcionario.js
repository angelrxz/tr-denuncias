const token = sessionStorage.getItem('token');
const perfil = sessionStorage.getItem('perfil');

if (!token || perfil !== 'funcionario') {
  window.location.href = 'index.html';
}

document.getElementById('saludo').textContent = 'Funcionario/a: ' + sessionStorage.getItem('nombre');

const listaDenuncias = document.getElementById('listaDenuncias');
const mensaje = document.getElementById('mensaje');
const filtroEstado = document.getElementById('filtroEstado');

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

  const estado = filtroEstado.value;
  const url = estado
    ? `/api/denuncias/denuncias?estado=${encodeURIComponent(estado)}`
    : '/api/denuncias/denuncias';

  try {
    const respuesta = await fetch(url, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const datos = await respuesta.json();

    if (respuesta.status === 401) {
      sessionStorage.clear();
      window.location.href = 'index.html';
      return;
    }

    if (!respuesta.ok) {
      mensaje.textContent = datos.error ? datos.error.mensaje : 'Error al cargar denuncias';
      return;
    }

    const denuncias = datos.datos || [];
    mensaje.textContent = denuncias.length === 0 ? 'No hay denuncias en este estado.' : '';

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

      listaDenuncias.appendChild(tarjeta);
    });
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

filtroEstado.addEventListener('change', cargarDenuncias);

document.getElementById('btnSalir').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'index.html';
});

cargarDenuncias();