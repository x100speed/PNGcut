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
  errorPickColor: 'Croma activado: haz clic en la imagen izquierda para elegir al menos un color de fondo.',
  chromaSectionTitle: 'Croma y vista previa',
  chromaOptionalNote:
    'Si el PNG ya tiene transparencia, desactiva el croma y divide. Con fondo opaco, actívalo y elige uno o más colores.',
  chromaEnable: 'Activar croma (quitar fondo opaco)',
  pickColorTitle: 'Elegir color(es) de fondo',
  pickColorHint:
    'Clic en colores de fondo a eliminar. Varios clics añaden varios colores. Un clic casi igual actualiza una muestra existente.',
  pickColorDisabled: 'Muestra el original si está desactivado; actívalo para muestrear.',
  previewTitle: 'Vista previa',
  previewResult: 'Resultado',
  previewMask: 'Mate',
  downloadKeyedImage: 'Descargar imagen',
  downloadKeyedHint: 'Descarga el PNG completo con croma (incluye pincel de protección), sin dividir',
  enlargePreview: 'Ampliar',
  enlargePreviewHint: 'Ver la vista previa en grande; o doble clic en la vista previa',
  closePreviewZoom: 'Cerrar',
  advancedTitle: 'Avanzado',
  advancedIntro:
    'Parecido al fondo → protección interior → suavidad del borde → spill → corte de alfa débil / erosión. Si sujeto y fondo se parecen, usa también el pincel de protección.',
  advancedGroupMatch: 'Muestreo y color',
  advancedGroupEdge: 'Borde y transición alfa',
  advancedGroupSpill: 'Spill (tinte en el borde)',
  advancedGroupDefringe: 'Anti-borde blanco (alfa débil / erosión)',
  tolerance: 'Tolerancia de color',
  toleranceDesc:
    'Los píxeles cercanos a cualquier muestra (hasta esta distancia) se vuelven transparentes. Alto puede comer el sujeto; bajo deja fondo.',
  protectInterior: 'Proteger interior (clave conectada)',
  protectInteriorDesc:
    'Solo recorta el fondo conectado al borde de la imagen. Zonas interiores del mismo color (ropa blanca, etc.) siguen opacas. Déjalo activado en general.',
  enclosedMin: 'Umbral de regiones cerradas',
  enclosedMinDesc:
    'Los huecos interiores del mismo color no conectados al borde (axilas, recortes) solo se recortan si su área ≥ este número de píxeles. Más alto = interior más seguro; 0 recorta todos los candidatos.',
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
  defringe: 'Anti-borde blanco completo',
  defringeDesc:
    'Descontamina mezcla de fondo, corta alfa débil y erosiona el contorno. Si se come la silueta, pon erosión en 0.',
  erodePx: 'Erosión del borde',
  erodePxDesc:
    'Reduce zonas opacas 0–3 px. 1 px suele quitar el borde blanco AA; demasiado alto come el sujeto.',
  alphaCutoff: 'Corte de alfa débil',
  alphaCutoffDesc:
    'Píxeles bajo este umbral de alfa pasan a transparentes (fantasmas de suavizado). Demasiado alto endurece el borde.',
  sampleRadius: 'Radio de muestreo',
  sampleRadiusDesc:
    'Promedia un área alrededor del clic para el color de fondo. Un poco mayor ayuda con ruido; demasiado mezcla el sujeto.',
  runSplit: 'Dividir ahora',
  runSplitAgain: 'Volver a dividir',
  colorPicked: 'Muestras de fondo',
  clearAllSamples: 'Borrar todas',
  removeSample: 'Eliminar este color',
  brushProtect: 'Pincel de protección (zonas pintadas mantienen el original)',
  brushDiameter: 'Diámetro del pincel',
  brushClear: 'Borrar trazos',
  brushHint:
    'En vista de resultado: pinta para restaurar zonas mal recortadas. Desactivado en vista máscara; cambiar muestras borra los trazos.',
  
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



