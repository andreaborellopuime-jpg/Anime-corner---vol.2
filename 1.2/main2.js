const formAnime = document.getElementById('form-serie');

formAnime.addEventListener('submit', async (e) => {
  e.preventDefault();

  const titulo = document.getElementById('titulo').value;
  const genero = document.getElementById('genero').value;
  const puntuacion = parseFloat(document.getElementById('puntuacion').value);
  const resena = document.getElementById('resena').value;

  const archivo = document.getElementById('image-file').files[0];

  let imagenUrl = 'https://via.placeholder.com/300x400?text=Sin+Portada';

  if (archivo) {
    const nombreArchivo = `${Date.now()}_${archivo.name}`;

    const { error: storageError } = await supabase.storage
      .from('portadas')
      .upload(nombreArchivo, archivo);

    if (storageError) {
      alert('Error al subir la imagen: ' + storageError.message);
      return;
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
    .from('animes') // <-- poné acá el nombre real de tu tabla
    .insert([nuevoAnime])
    .select();

  if (error) {
    console.error('Detalle del error de Supabase:', error);
    alert('Error al guardar en Supabase: ' + error.message);
  } else {
    console.log('Guardado exitoso:', data);
    alert('¡Serie recomendada y guardada con éxito!');
    formAnime.reset();
  }
});