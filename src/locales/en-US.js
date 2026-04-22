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
  errorPickColor: 'Chroma key is on — click the left image to pick the background color to remove.',
  
  chromaSectionTitle: 'Chroma key & preview',
  chromaOptionalNote:
    'If your PNG already has transparency, turn off chroma key and click Split. For solid backgrounds, turn it on and pick a color.',
  chromaEnable: 'Enable chroma key (remove opaque background)',
  pickColorTitle: 'Pick background color',
  pickColorHint: 'Click the color you want treated as background (greenscreen, solid color, etc.).',
  pickColorDisabled: 'Original image is shown when chroma key is off; turn it on to pick a color.',
  previewTitle: 'Preview',
  previewResult: 'Keyed result',
  previewMask: 'Matte',
  advancedTitle: 'Advanced',
  advancedIntro:
    'Grouped in three steps: how “similar to background” is keyed, how soft the edge is, then spill cleanup. If subject and background colors overlap, use the protect brush above.',
  advancedGroupMatch: 'Sampling & color match',
  advancedGroupEdge: 'Edge & alpha transition',
  advancedGroupSpill: 'Spill removal (edge tint)',
  tolerance: 'Color tolerance',
  toleranceDesc:
    'Pixels within this color distance from the sampled background are keyed transparent. Higher removes more but can eat subject colors that match the background; too low leaves background fringes.',
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
  sampleRadius: 'Sample radius',
  sampleRadiusDesc:
    'Averages color in a square around your click for the background sample. Slightly larger resists noise; too large may mix in subject color.',
  runSplit: 'Split now',
  runSplitAgain: 'Split again',
  colorPicked: 'Sample',
  brushProtect: 'Protect brush (painted areas keep original pixels)',
  brushDiameter: 'Brush diameter',
  brushClear: 'Clear strokes',
  brushHint:
    'In Keyed result view: paint where the subject was wrongly keyed out. Mask view shows alpha after protection; brush is off there. Picking a new background color clears strokes.',
  
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



