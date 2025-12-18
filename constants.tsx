
import { Theme } from './types';

export const THEMES: Theme[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Clean and simple modern pixel art style.',
    promptSuffix: 'modern clean pixel art, standard color palette, balanced shading, clear silhouette',
    color: 'bg-blue-500'
  },
  {
    id: 'retro',
    name: 'Retro',
    description: 'Classic 16-bit arcade look with high contrast.',
    promptSuffix: 'classic 90s arcade pixel art, vibrant 16-bit color palette, sharp edges, high contrast, dithering',
    color: 'bg-pink-500'
  },
  {
    id: 'pastel',
    name: 'Pastel',
    description: 'Soft, dreamy colors with gentle aesthetic.',
    promptSuffix: 'cute pastel pixel art, soft aesthetic, light colors, minimal shading, dreamlike, kawaii style',
    color: 'bg-purple-300'
  },
  {
    id: 'bw',
    name: 'Black and White',
    description: 'High contrast monochrome retro style.',
    promptSuffix: 'monochrome pixel art, black and white only, 1-bit or 2-bit style, high contrast, clean shapes',
    color: 'bg-slate-400'
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Dark futuristic style with glowing colors.',
    promptSuffix: 'cyberpunk neon pixel art, glowing outlines, dark futuristic palette, vaporwave colors, high saturation',
    color: 'bg-indigo-600'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Very simple shapes and very few colors.',
    promptSuffix: 'minimalist pixel art, ultra-simple shapes, limited 4-color palette, PICO-8 aesthetic',
    color: 'bg-red-500'
  }
];
