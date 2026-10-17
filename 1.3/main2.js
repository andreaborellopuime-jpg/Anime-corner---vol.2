// Referencias del DOM
const formAnime = document.getElementById('form-serie');
const gridSeries = document.getElementById('contenedor-cards');

// Cargar las series al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
  cargarSeries();
});

// FUNCIÓN PARA CONSULTAR Y RENDERIZAR LAS SERIES
async function cargarSeries() {
  if (!gridSeries) return;

  gridSeries.innerHTML = '<p class="subtitle">Cargando recomendaciones...</p>';

  // Consultar todas las series ordenadas de más reciente a más antigua
  const { data: series, error } = await supabase
    .from('animes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al cargar series:', error);
    gridSeries.innerHTML = '<p class="subtitle">Error al cargar las series.</p>';
    return;
  }

  if (!series || series.length === 0) {
    gridSeries.innerHTML = '<p class="subtitle">Aún no hay series recomendadas. ¡Sé el primero en publicar una!</p>';
    return;
  }

  gridSeries.innerHTML = '';

  series.forEach(serie => {
    const card = document.createElement('article');
    card.className = 'card-serie';

    card.innerHTML = `
      <img src="${serie.imagen_url}" alt="Portada de ${serie.titulo}" onerror="this.src='https://placehold.co/300x400?text=Sin+Portada'">
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
      </div>
    `;

    gridSeries.appendChild(card);
  });
}

//==============================================//

// EVENTO DE ENVÍO DEL FORMULARIO (INSERT)
formAnime.addEventListener('submit', async (e) => {
  e.preventDefault();

  const btnSubmit = formAnime.querySelector('button[type="submit"]');
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Guardando...';

  try {
    const titulo = document.getElementById('titulo').value.trim();
    const genero = document.getElementById('genero').value;
    const puntuacion = parseFloat(document.getElementById('puntuacion').value);
    const resena = document.getElementById('resena').value.trim();

    const archivo = document.getElementById('image-file').files[0];

    let imagenUrl = 'https://placehold.co/300x400?text=Sin+Portada';

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

    console.log('Intentando guardar:', nuevoAnime);

    const { data, error } = await supabase
      .from('animes')
      .insert([nuevoAnime])
      .select();

    if (error) {
      console.error('Detalle del error de Supabase:', error);
      throw new Error('Error al guardar en Supabase: ' + error.message);
    }

    console.log('Guardado exitoso:', data);
    alert('¡Serie recomendada y guardada con éxito!');
    formAnime.reset();

    // Recargamos la lista para ver la nueva serie de inmediato
    await cargarSeries();

  } catch (err) {
    alert(err.message);
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Publicar Recomendación';
  }
});