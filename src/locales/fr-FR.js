/**
 * Français (French) language pack
 */
export default {
  // Titre et description
  title: 'Outil de Division PNG',
  subtitle:
    'Incrustation optionnelle, puis découpe en rectangles selon la transparence (ou image déjà avec alpha)',
  
  // Texte des boutons
  selectImage: 'Sélectionner une Image PNG',
  processing: 'Traitement...',
  downloadAll: 'Tout Télécharger',
  downloadComponent: 'Télécharger le Composant',
  
  // Messages d'erreur
  errorInvalidFormat: 'Veuillez télécharger une image au format PNG !',
  errorNoComponents: 'Aucun composant UI détecté ! Veuillez vous assurer que l\'image contient des zones non transparentes.',
  errorProcessFailed: 'Échec du traitement de l\'image : ',
  errorLoadFailed: 'Échec du chargement de l\'image, veuillez vérifier si le fichier est corrompu',
  errorReadFailed: 'Échec de la lecture du fichier',
  errorNoImages: 'Aucune image à télécharger !',
  errorPickColor: 'Incrustation activée — cliquez sur l’image de gauche pour choisir la couleur de fond.',
  chromaSectionTitle: 'Incrustation et aperçu',
  chromaOptionalNote:
    'Si le PNG a déjà de la transparence, désactivez l’incrustation puis Découper. Sinon activez et choisissez une couleur.',
  chromaEnable: 'Activer l’incrustation (supprimer le fond opaque)',
  pickColorTitle: 'Choisir la couleur de fond',
  pickColorHint: 'Cliquez sur la couleur à traiter comme fond (fond vert, couleur unie, etc.).',
  pickColorDisabled: 'Image d’origine si désactivé ; activez pour échantillonner.',
  previewTitle: 'Aperçu',
  previewResult: 'Résultat',
  previewMask: 'Masque',
  advancedTitle: 'Avancé',
  advancedIntro:
    'Trois blocs : ressemblance au fond, douceur du bord, puis spill. Si sujet et fond se ressemblent, utilisez aussi le pinceau de protection.',
  advancedGroupMatch: 'Échantillonnage & couleur',
  advancedGroupEdge: 'Bord & transition alpha',
  advancedGroupSpill: 'Spill (liseré de couleur)',
  tolerance: 'Tolérance couleur',
  toleranceDesc:
    'Les pixels proches de la couleur échantillonnée (jusqu’à cette distance) deviennent transparents. Trop haut mange le sujet ; trop bas laisse du fond.',
  softness: 'Feather (px)',
  softnessDesc:
    'Largeur de la transition opaque → transparent près du seuil. Plus grand = bord plus doux. Actif seulement si l’adoucissement est coché.',
  edgeSmooth: 'Adoucissement des bords',
  edgeSmoothDesc: 'Désactivé = détourage dur. Activé = utilise le feather pour une transition d’alpha douce.',
  edgeRadius: 'Rayon de bord',
  edgeRadiusDesc:
    'Zone autour du contour où le déspill s’applique (px). Les pixels proches du bord transparent sont plus corrigés.',
  despill: 'Suppression du spill',
  despillDesc:
    'Réduit la couleur du fond qui déteint sur le sujet (vert d’écran, etc.). Désactivé = pas de correction de teinte.',
  despillStrength: 'Intensité spill',
  despillStrengthDesc: 'Force du déspill. Trop élevé peut griser les bords.',
  sampleRadius: 'Rayon d’échantillonnage',
  sampleRadiusDesc:
    'Moyenne autour du clic pour la couleur de fond. Un peu plus large résiste au bruit ; trop large mélange le sujet.',
  runSplit: 'Découper',
  runSplitAgain: 'Redécouper',
  colorPicked: 'Échantillon',
  brushProtect: 'Pinceau de protection (zones peintes = pixels d’origine)',
  brushDiameter: 'Diamètre du pinceau',
  brushClear: 'Effacer les coups',
  brushHint:
    'Vue résultat incrusté : peignez pour restaurer les zones trop transparentes. Désactivé en vue masque ; nouvelle couleur de fond efface les coups.',
  
  // Aperçu et résultats
  resultsTitle: 'Résultats de Division',
  resultsDescription: 'Chaque composant UI a été automatiquement identifié et divisé en images PNG indépendantes avec des arrière-plans transparents.',
  identifiedComponents: 'Identifiés',
  components: 'composants UI indépendants',
  
  // Informations sur l'image
  component: 'Composant',
  size: 'Taille',
  position: 'Position',
  pixels: 'pixels',
  
  // Message de chargement
  processingImage: 'Traitement de l\'image...',
}



