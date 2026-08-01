/**
 * English (US) language pack
 */
export default {
  // Title and description
  title: 'PNG Splitter Tool',
  subtitle:
    'Optional chroma-key, then split PNGs into tight rectangles by transparency (or split images that already have alpha)',
  
  // Button text
  selectImage: 'Select PNG Image',
  processing: 'Processing...',
  downloadAll: 'Download All',
  downloadComponent: 'Download Component',
  
  // Error messages
  errorInvalidFormat: 'Please upload a PNG format image!',
  errorNoComponents: 'No UI components detected! Please ensure the image contains non-transparent areas.',
  errorProcessFailed: 'Image processing failed: ',
  errorLoadFailed: 'Image loading failed, please check if the file is corrupted',
  errorReadFailed: 'File read failed',
  errorNoImages: 'No images to download!',
  errorPickColor: 'Chroma key is on — click the left image to pick at least one background color to remove.',
  
  chromaSectionTitle: 'Chroma key & preview',
  chromaOptionalNote:
    'If your PNG already has transparency, turn off chroma key and click Split. For solid backgrounds, turn it on and pick one or more colors.',
  chromaEnable: 'Enable chroma key (remove opaque background)',
  pickColorTitle: 'Pick background color(s)',
  pickColorHint:
    'Click colors to treat as background. Click multiple times to add several colors (multi-tone backgrounds). Near-duplicate clicks update an existing sample.',
  pickColorDisabled: 'Original image is shown when chroma key is off; turn it on to pick a color.',
  previewTitle: 'Preview',
  previewResult: 'Keyed result',
  previewMask: 'Matte',
  downloadKeyedImage: 'Download image',
  downloadKeyedHint: 'Download the full keyed PNG (with protect brush), without splitting',
  enlargePreview: 'Enlarge',
  enlargePreviewHint: 'View keyed preview larger; or double-click the preview',
  closePreviewZoom: 'Close',
  advancedTitle: 'Advanced',
  advancedIntro:
    'Grouped steps: how “similar to background” is keyed (with interior protection), how soft the edge is, spill cleanup, then weak-alpha cut & edge erode. Use the protect brush if subject and background colors overlap.',
  advancedGroupMatch: 'Sampling & color match',
  advancedGroupEdge: 'Edge & alpha transition',
  advancedGroupSpill: 'Spill removal (edge tint)',
  advancedGroupDefringe: 'Defringe (weak alpha / erode)',
  tolerance: 'Color tolerance',
  toleranceDesc:
    'Pixels within this color distance from any sampled background are keyed transparent. Higher removes more but can eat subject colors; too low leaves background fringes.',
  protectInterior: 'Protect interior (connected key)',
  protectInteriorDesc:
    'Only keys background connected to the image edge. Interior same-color areas (white clothes, light gear) stay opaque. Keep on in most cases.',
  enclosedMin: 'Enclosed region threshold',
  enclosedMinDesc:
    'Interior same-color holes not connected to the edge (armpits, cutouts) are keyed only if their area ≥ this pixel count. Higher = safer interior; 0 keys all candidates.',
  softness: 'Feather (px)',
  softnessDesc:
    'Width of the transition from opaque to transparent near the threshold. Larger = softer edge. Only applies when “Edge feathering” is on.',
  edgeSmooth: 'Edge feathering',
  edgeSmoothDesc: 'Off = hard cutout. On = use feather radius for a smooth alpha transition.',
  edgeRadius: 'Edge radius',
  edgeRadiusDesc:
    'How far from the keyed edge spill correction is considered (px). Mostly for despill: pixels closer to the silhouette get stronger background-color removal.',
  despill: 'Spill removal',
  despillDesc:
    'Reduces background color bleeding into the subject edge (green spill, blue fringes, etc.). Off = no hue correction for spill.',
  despillStrength: 'Spill strength',
  despillStrengthDesc: 'How strong spill removal is. Too high can make edges look gray or flat.',
  defringe: 'Full defringe',
  defringeDesc:
    'When on: decontaminate background mix in semi-transparent pixels, cut weak fringe alpha, then erode opaque edges. If the silhouette gets bitten, set edge erode to 0.',
  erodePx: 'Edge erode',
  erodePxDesc:
    'Morphologically shrink opaque areas by 0–3 px. 1 px often removes AA white outlines; too high may eat the subject silhouette.',
  alphaCutoff: 'Weak alpha cutoff',
  alphaCutoffDesc:
    'Pixels with alpha below this value become fully transparent — clears faint feather ghosts. Higher = more aggressive; too high hardens edges.',
  sampleRadius: 'Sample radius',
  sampleRadiusDesc:
    'Averages color in a square around your click for the background sample. Slightly larger resists noise; too large may mix in subject color.',
  runSplit: 'Split now',
  runSplitAgain: 'Split again',
  colorPicked: 'Background samples',
  clearAllSamples: 'Clear all',
  removeSample: 'Remove this color',
  brushProtect: 'Protect brush (painted areas keep original pixels)',
  brushDiameter: 'Brush diameter',
  brushClear: 'Clear strokes',
  brushHint:
    'In Keyed result view: paint where the subject was wrongly keyed out. Mask view shows alpha after protection; brush is off there. Changing samples clears strokes.',
  
  // Preview and results
  resultsTitle: 'Split Results',
  resultsDescription: 'Each UI component has been automatically identified and split into independent PNG images with transparent backgrounds.',
  identifiedComponents: 'Identified',
  components: 'independent UI components',
  
  // Image information
  component: 'Component',
  size: 'Size',
  position: 'Position',
  pixels: 'pixels',
  
  // Loading message
  processingImage: 'Processing image...',
}



