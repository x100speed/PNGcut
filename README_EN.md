# PNG Splitter Tool

A React-based web tool for splitting PNG images with Alpha channels into multiple rectangular images. Perfect for processing UI component spritesheets.

**One-liner:** A smart web tool that automatically detects and extracts individual UI components from PNG images with transparency, splitting them into separate downloadable images.

## Features

- 📤 **Image Upload**: Supports uploading PNG format images
- 🔍 **Alpha Channel Detection**: Automatically detects non-transparent areas in images
- ✂️ **Smart Splitting**: Splits non-transparent areas into independent rectangular images
- 👀 **Real-time Preview**: Preview the original image and all split images
- 💾 **Batch Download**: Supports individual download or batch download of all split images
- 🌐 **Multi-language Support**: Supports Chinese, English, Japanese, French, Spanish, and Korean

## Tech Stack

- **React 18** - Frontend framework
- **Vite** - Build tool
- **Canvas API** - Image processing

## Installation and Running

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Build Production Version

```bash
npm run build
```

### 4. Preview Production Build

```bash
npm run preview
```

## How to Use

1. Click the "Select PNG Image" button to upload a PNG image with Alpha channel
2. The system will automatically detect non-transparent areas in the image
3. Each non-transparent area will be split into an independent rectangular image
4. View all split images in the results area
5. Click the "Download" button on individual images to download them, or click "Download All" to batch download

## How It Works

1. **Pixel Detection**: Reads each pixel of the image and detects Alpha channel values
2. **Connected Region Detection**: Uses Depth-First Search (DFS) algorithm to find all connected non-transparent regions
3. **Rectangle Extraction**: Calculates the minimum bounding rectangle for each connected region
4. **Image Splitting**: Uses Canvas API to split each rectangular region into an independent image

## Notes

- Currently only supports PNG format images
- Each independent non-transparent area in the image will be split into a rectangle
- Split images will retain the original Alpha channel information

