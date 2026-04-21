/**
 * Español (Spanish) language pack
 */
export default {
  // Título y descripción
  title: 'Herramienta de División PNG',
  subtitle:
    'Croma opcional y luego divide en rectángulos por transparencia (o imágenes que ya tienen alpha)',
  
  // Texto de botones
  selectImage: 'Seleccionar Imagen PNG',
  processing: 'Procesando...',
  downloadAll: 'Descargar Todo',
  downloadComponent: 'Descargar Componente',
  
  // Mensajes de error
  errorInvalidFormat: '¡Por favor sube una imagen en formato PNG!',
  errorNoComponents: '¡No se detectaron componentes de UI! Por favor asegúrate de que la imagen contenga áreas no transparentes.',
  errorProcessFailed: 'Error al procesar la imagen: ',
  errorLoadFailed: 'Error al cargar la imagen, por favor verifica si el archivo está dañado',
  errorReadFailed: 'Error al leer el archivo',
  errorNoImages: '¡No hay imágenes para descargar!',
  errorPickColor: 'Croma activado: haz clic en la imagen izquierda para elegir el color de fondo.',
  chromaSectionTitle: 'Croma y vista previa',
  chromaOptionalNote:
    'Si el PNG ya tiene transparencia, desactiva el croma y divide. Con fondo opaco, actívalo y elige color.',
  chromaEnable: 'Activar croma (quitar fondo opaco)',
  pickColorTitle: 'Elegir color de fondo',
  pickColorHint: 'Clic en el color de fondo a eliminar (pantalla verde, color liso, etc.).',
  pickColorDisabled: 'Muestra el original si está desactivado; actívalo para muestrear.',
  previewTitle: 'Vista previa',
  previewResult: 'Resultado',
  previewMask: 'Mate',
  advancedTitle: 'Avanzado',
  advancedIntro:
    'Tres bloques: qué tan “parecido al fondo” se recorta, suavidad del borde y spill. Si sujeto y fondo se parecen, usa también el pincel de protección.',
  advancedGroupMatch: 'Muestreo y color',
  advancedGroupEdge: 'Borde y transición alfa',
  advancedGroupSpill: 'Spill (tinte en el borde)',
  tolerance: 'Tolerancia de color',
  toleranceDesc:
    'Los píxeles dentro de esta distancia cromática del fondo muestreado se vuelven transparentes. Alto puede comer el sujeto; bajo deja fondo.',
  softness: 'Suavizado (px)',
  softnessDesc:
    'Ancho de la transición opaco → transparente cerca del umbral. Mayor = borde más suave. Solo si “Suavizado de bordes” está activado.',
  edgeSmooth: 'Suavizado de bordes',
  edgeSmoothDesc: 'Desactivado = recorte duro. Activado = usa el radio de suavizado para transición de alfa.',
  edgeRadius: 'Radio de borde',
  edgeRadiusDesc:
    'Zona cerca del contorno donde actúa el despill (px). Más cerca del borde transparente, más corrección de tinte.',
  despill: 'Eliminar spill',
  despillDesc:
    'Reduce el color de fondo que se filtra al borde del sujeto (p. ej. verde). Desactivado = sin corrección de matiz.',
  despillStrength: 'Fuerza de spill',
  despillStrengthDesc: 'Intensidad del despill. Demasiado puede dejar bordes grisáceos.',
  sampleRadius: 'Radio de muestreo',
  sampleRadiusDesc:
    'Promedia un área alrededor del clic para el color de fondo. Un poco mayor ayuda con ruido; demasiado mezcla el sujeto.',
  runSplit: 'Dividir ahora',
  runSplitAgain: 'Volver a dividir',
  colorPicked: 'Muestra',
  brushProtect: 'Pincel de protección (zonas pintadas mantienen el original)',
  brushDiameter: 'Diámetro del pincel',
  brushClear: 'Borrar trazos',
  brushHint:
    'En vista de resultado: pinta para restaurar zonas mal recortadas. Desactivado en vista máscara; nuevo color de fondo borra los trazos.',
  
  // Vista previa y resultados
  resultsTitle: 'Resultados de División',
  resultsDescription: 'Cada componente de UI ha sido identificado automáticamente y dividido en imágenes PNG independientes con fondos transparentes.',
  identifiedComponents: 'Identificados',
  components: 'componentes de UI independientes',
  
  // Información de imagen
  component: 'Componente',
  size: 'Tamaño',
  position: 'Posición',
  pixels: 'píxeles',
  
  // Mensaje de carga
  processingImage: 'Procesando imagen...',
}



