// Referencias del DOM
const tituloForm = document.getElementById('titulo-form');
const formAnime = document.getElementById('form-serie');
const gridSeries = document.getElementById('grid-series');
const btnCancelar = document.getElementById('btn-cancelar');

const IMAGEN_POR_DEFECTO = 'https://placehold.co/300x400?text=Sin+Portada';
let seriesCargadas = [];

document.addEventListener('DOMContentLoaded', () => {
  cargarSeries();
});

// FUNCIÓN PARA CONSULTAR Y RENDERIZAR LAS SERIES
async function cargarSeries() {
  if (!gridSeries) return;

  gridSeries.innerHTML = '<p class="subtitle">Cargando recomendaciones...</p>';

  const { data: series, error } = await supabase
    .from('animes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al cargar series:', error);
    gridSeries.innerHTML = '<p class="subtitle">Error al cargar las series.</p>';
    return;
  }

  seriesCargadas = series || [];

  if (seriesCargadas.length === 0) {
    gridSeries.innerHTML = '<p class="subtitle">Aún no hay series recomendadas. ¡Sé el primero en publicar una!</p>';
    return;
  }

  gridSeries.innerHTML = '';

  seriesCargadas.forEach(serie => {
    const card = document.createElement('article');
    card.className = 'card-serie';

    card.innerHTML = `
      <img src="${serie.imagen_url}" alt="Portada de ${serie.titulo}" onerror="this.src='${IMAGEN_POR_DEFECTO}'">
      <div class="card-body">
        <div class="card-header-info">
          <span class="badge-genero">${serie.genero || 'General'}</span>
          <span class="score">★ ${serie.puntuacion || 0}</span>
        </div>
        <h3 class="card-title">${serie.titulo}</h3>
        <p class="card-resena">${serie.resena || ''}</p>
        <div class="card-footer-author">
          Recomendado por: ${serie.user_email || 'Anónimo'}
        </div>
        <div class="card-actions">
          <button type="button" class="btn-action btn-edit">Editar</button>
          <button type="button" class="btn-action btn-delete">Eliminar</button>
        </div>
      </div>
    `;

    card.querySelector('.btn-edit').addEventListener('click', () => editarSerie(serie.id));
    card.querySelector('.btn-delete').addEventListener('click', () => eliminarSerie(serie.id));

    gridSeries.appendChild(card);
  });
}

//==============================================//

// ELIMINAR (DELETE)
async function eliminarSerie(id) {
  if (!confirm('¿Seguro que querés eliminar esta serie?')) return;

  const { data, error } = await supabase
    .from('animes')
    .delete()
    .eq('id', id)
    .select();

  if (error) {
    alert('Error al eliminar: ' + error.message);
    return;
  }

  // Si RLS bloquea el DELETE, no hay error pero tampoco se borra nada
  if (!data || data.length === 0) {
    alert('No se pudo eliminar. Revisá la policy de DELETE en Supabase.');
    return;
  }

  await cargarSeries();
}

// EDITAR: carga los datos de la tarjeta en el formulario
function editarSerie(id) {
  const serie = seriesCargadas.find(s => s.id === id);
  if (!serie) return;

  document.getElementById('serie-id').value = serie.id;
  document.getElementById('titulo').value = serie.titulo;
  document.getElementById('genero').value = serie.genero;
  document.getElementById('puntuacion').value = serie.puntuacion;
  document.getElementById('resena').value = serie.resena;

  formAnime.querySelector('button[type="submit"]').textContent = 'Guardar cambios';
  btnCancelar.style.display = 'block';
  tituloForm.textContent = 'Editar Recomendación';

  document.getElementById('formulario').scrollIntoView({ behavior: 'smooth' });
}

// Vuelve el formulario al modo "crear"
function salirModoEdicion() {
  formAnime.reset();
  document.getElementById('serie-id').value = '';
  formAnime.querySelector('button[type="submit"]').textContent = 'Publicar Recomendación';
  btnCancelar.style.display = 'none';
}

btnCancelar.addEventListener('click', salirModoEdicion);

//==============================================//

// ENVÍO DEL FORMULARIO (INSERT o UPDATE)
formAnime.addEventListener('submit', async (e) => {
  e.preventDefault();

  const btnSubmit = formAnime.querySelector('button[type="submit"]');
  const textoOriginal = btnSubmit.textContent;
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Guardando...';

  try {
    const serieId = document.getElementById('serie-id').value;
    const titulo = document.getElementById('titulo').value.trim();
    const genero = document.getElementById('genero').value;
    const puntuacion = parseFloat(document.getElementById('puntuacion').value);
    const resena = document.getElementById('resena').value.trim();

    const archivo = document.getElementById('image-file').files[0];

    // Si se edita, conservamos la portada actual salvo que elijan una nueva
    let imagenUrl = IMAGEN_POR_DEFECTO;
    if (serieId) {
      const actual = seriesCargadas.find(s => String(s.id) === serieId);
      if (actual && actual.imagen_url) imagenUrl = actual.imagen_url;
    }

    if (archivo) {
      const nombreArchivo = `${Date.now()}_${archivo.name}`;

      const { error: storageError } = await supabase.storage
        .from('portadas')
        .upload(nombreArchivo, archivo);

      if (storageError) {
        throw new Error('Error al subir la imagen: ' + storageError.message);
      }

      const { data: urlData } = supabase.storage
        .from('portadas')
        .getPublicUrl(nombreArchivo);

      imagenUrl = urlData.publicUrl;
    }

    const nuevoAnime = {
      titulo,
      genero,
      puntuacion,
      imagen_url: imagenUrl,
      resena,
      user_email: 'alumno@escuela.edu.ar'
    };

    if (serieId) {
      // UPDATE
      const { data, error } = await supabase
        .from('animes')
        .update(nuevoAnime)
        .eq('id', serieId)
        .select();

      if (error) throw new Error('Error al actualizar: ' + error.message);
      if (!data || data.length === 0) {
        throw new Error('No se pudo actualizar. Revisá la policy de UPDATE en Supabase.');
      }

      alert('¡Serie actualizada con éxito!');
    } else {
      // INSERT
      const { data, error } = await supabase
        .from('animes')
        .insert([nuevoAnime])
        .select();

      if (error) throw new Error('Error al guardar en Supabase: ' + error.message);

      console.log('Guardado exitoso:', data);
      alert('¡Serie recomendada y guardada con éxito!');
    }

    salirModoEdicion();
    await cargarSeries();

  } catch (err) {
    alert(err.message);
    btnSubmit.textContent = textoOriginal;
  } finally {
    btnSubmit.disabled = false;
  }
});