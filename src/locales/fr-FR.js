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
  dropzoneTitle: 'Déposez une image PNG ici',
  dropzoneHint: 'Ou cliquez sur cette zone / le bouton pour choisir un fichier',
  dropzoneAria: 'Déposer ou sélectionner une image PNG',
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
  errorPickColor: 'Incrustation activée — cliquez sur l’image de gauche pour choisir au moins une couleur de fond.',
  chromaSectionTitle: 'Incrustation et aperçu',
  chromaOptionalNote:
    'Si le PNG a déjà de la transparence, désactivez l’incrustation puis Découper. Sinon activez et choisissez une ou plusieurs couleurs.',
  chromaEnable: 'Activer l’incrustation (supprimer le fond opaque)',
  pickColorTitle: 'Choisir la/les couleur(s) de fond',
  pickColorHint:
    'Clic gauche pour échantillonner (plusieurs couleurs possibles). Molette pour zoomer ; clic droit + glisser pour déplacer.',
  pickColorDisabled: 'Image d’origine si désactivé ; activez pour échantillonner. Zoom/pan restent disponibles.',
  pickZoomLabel: 'Zoom',
  resetPickView: 'Réinitialiser la vue',
  previewTitle: 'Aperçu',
  previewResult: 'Résultat',
  previewMask: 'Masque',
  downloadKeyedImage: 'Télécharger l’image',
  downloadKeyedHint: 'Télécharger le PNG incrusté entier (avec pinceau de protection), sans découpe',
  enlargePreview: 'Agrandir',
  enlargePreviewHint: 'Voir l’aperçu en grand ; ou double-cliquer l’aperçu',
  closePreviewZoom: 'Fermer',
  advancedTitle: 'Avancé',
  advancedIntro:
    'Ressemblance au fond → protection intérieure → douceur du bord → spill → coupure d’alpha faible / érosion. Si sujet et fond se ressemblent, utilisez aussi le pinceau de protection.',
  advancedGroupMatch: 'Échantillonnage & couleur',
  advancedGroupEdge: 'Bord & transition alpha',
  advancedGroupSpill: 'Spill (liseré de couleur)',
  advancedGroupDefringe: 'Anti-frange (alpha faible / érosion)',
  tolerance: 'Tolérance couleur',
  toleranceDesc:
    'Les pixels proches de n’importe quel échantillon (jusqu’à cette distance) deviennent transparents. Trop haut mange le sujet ; trop bas laisse du fond.',
  protectInterior: 'Protéger l’intérieur (clé connectée)',
  protectInteriorDesc:
    'Ne détoure que le fond relié au bord de l’image. Les zones intérieures de même couleur (vêtements blancs, etc.) restent opaques. À garder activé en général.',
  enclosedMin: 'Seuil de régions fermées',
  enclosedMinDesc:
    'Les trous intérieurs de même couleur non reliés au bord (aisselles, découpes) ne sont détourés que si leur surface ≥ ce nombre de pixels. Plus haut = intérieur plus sûr ; 0 détoure tous les candidats.',
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
  defringe: 'Anti-frange (décontamination / liseré)',
  defringeDesc:
    'Retire le mélange de fond dans les pixels semi-transparents et le liseré proche de l’échantillon. L’érosion et le seuil d’alpha ci-dessous s’appliquent toujours indépendamment.',
  erodePx: 'Érosion du bord',
  erodePxDesc:
    'Réduit la silhouette opaque de 0 à 15 px pour couper le liseré blanc. Pour les grandes images, essayez 2–8 ; peu visible en petit aperçu — utilisez Agrandir ou téléchargez.',
  alphaCutoff: 'Seuil d’alpha faible',
  alphaCutoffDesc:
    'Les pixels sous ce seuil deviennent totalement transparents (toujours indépendant). Trop haut durcit les bords.',
  sampleRadius: 'Rayon d’échantillonnage',
  sampleRadiusDesc:
    'Moyenne autour du clic pour la couleur de fond. Un peu plus large résiste au bruit ; trop large mélange le sujet.',
  runSplit: 'Découper',
  runSplitAgain: 'Redécouper',
  colorPicked: 'Échantillons de fond',
  clearAllSamples: 'Tout effacer',
  removeSample: 'Supprimer cette couleur',
  brushProtect: 'Pinceau de protection (zones peintes = pixels d’origine)',
  brushDiameter: 'Diamètre du pinceau',
  brushClear: 'Effacer les coups',
  brushHint:
    'Vue résultat : peignez pour restaurer les zones trop transparentes. Désactivé en vue masque ; changer les échantillons efface les coups.',
  
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



