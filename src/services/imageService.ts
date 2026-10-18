import { GeneratedImage } from '../types';
import { StorageService } from './storageService';

export interface ImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  model: string;
  aspectRatio: string;
  style: string;
  seed?: number;
  geminiApiKey?: string;
}

export const IMAGE_MODELS = [
  { id: 'flux', name: 'Flux 1.1 Pro (Recommended)', desc: 'Highest photorealism & detail' },
  { id: 'imagen-3', name: 'Google Imagen 3', desc: 'Google next-gen photorealistic diffusion' },
  { id: 'flux-realism', name: 'Flux Realism', desc: 'True-to-life portraits & studio photography' },
  { id: 'flux-anime', name: 'Flux Anime', desc: 'Vibrant modern anime aesthetic' },
  { id: 'flux-3d', name: 'Flux 3D Cinema', desc: 'Unreal Engine 5 & Pixar 3D rendering' },
  { id: 'turbo', name: 'SDXL Turbo', desc: 'Lightning fast 1-second generation' }
];

export const ASPECT_RATIOS: Record<string, { label: string; width: number; height: number; icon: string }> = {
  '1:1': { label: '1:1 Square', width: 1024, height: 1024, icon: 'Square' },
  '16:9': { label: '16:9 Landscape', width: 1280, height: 720, icon: 'RectangleHorizontal' },
  '9:16': { label: '9:16 Portrait / Reels', width: 720, height: 1280, icon: 'RectangleVertical' },
  '4:3': { label: '4:3 Standard', width: 1024, height: 768, icon: 'Tv' },
  '21:9': { label: '21:9 Ultrawide Cinema', width: 1344, height: 576, icon: 'Film' }
};

export const STYLE_PRESETS: Record<string, { name: string; suffix: string }> = {
  'photorealistic': {
    name: 'Photorealistic 8K',
    suffix: ', award winning photography, 8k resolution, highly detailed, photorealistic, cinematic natural lighting, Hasselblad H6D-100c'
  },
  'cinematic': {
    name: 'Cinematic Film',
    suffix: ', 35mm film still, cinematic lighting, anamorphic lens flare, shallow depth of field, dramatic atmosphere, blockbuster color grading'
  },
  'cyberpunk': {
    name: 'Cyberpunk Neon',
    suffix: ', neon drenched, futuristic cyberpunk cityscape, volumetric fog, vibrant magenta and cyan lighting, hyper-detailed tech'
  },
  'anime': {
    name: 'Anime & Manga',
    suffix: ', modern Makoto Shinkai anime style, vibrant aesthetic, crisp linework, studio quality illustration, masterpiece'
  },
  '3d-render': {
    name: '3D Pixar / Unreal 5',
    suffix: ', octane 3d render, Unreal Engine 5, ray tracing, cute stylized character, soft subsurface scattering, volumetric glow'
  },
  'fantasy': {
    name: 'Dark Fantasy',
    suffix: ', dark fantasy concept art, Elden Ring aesthetic, epic atmosphere, intricate dark gothic architecture, magical luminescence'
  },
  'minimalist': {
    name: 'Minimalist Vector',
    suffix: ', clean vector art, flat design, modern minimalist aesthetic, elegant composition, pastel color palette'
  }
};

export class ImageService {
  static async generateImage(options: ImageGenerationOptions): Promise<GeneratedImage> {
    const ratioConfig = ASPECT_RATIOS[options.aspectRatio] || ASPECT_RATIOS['1:1'];
    const stylePreset = STYLE_PRESETS[options.style];
    const finalSeed = options.seed !== undefined ? options.seed : Math.floor(Math.random() * 1000000000);

    // Apply style suffix
    let enhancedPrompt = options.prompt.trim();
    if (stylePreset && !enhancedPrompt.toLowerCase().includes(options.style)) {
      enhancedPrompt += stylePreset.suffix;
    }

    let finalImageUrl = '';

    // If Google Imagen 3 selected and user has geminiApiKey
    if (options.model === 'imagen-3' && options.geminiApiKey && options.geminiApiKey.trim()) {
      try {
        const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${options.geminiApiKey.trim()}`;
        const ratioMap: Record<string, string> = {
          '1:1': '1:1',
          '16:9': '16:9',
          '9:16': '9:16',
          '4:3': '4:3'
        };
        const targetRatio = ratioMap[options.aspectRatio] || '1:1';

        const res = await fetch(imagenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt: enhancedPrompt }],
            parameters: {
              sampleCount: 1,
              aspectRatio: targetRatio
            }
          })
        });

        if (res.ok) {
          const json = await res.json();
          const base64Data = json.predictions?.[0]?.bytesBase64Encoded;
          if (base64Data) {
            finalImageUrl = `data:image/jpeg;base64,${base64Data}`;
          }
        }
      } catch (e) {
        console.warn('Google Imagen 3 API error, falling back to Flux Pro:', e);
      }
    }

    // Default Flux / SDXL Turbo Generation
    if (!finalImageUrl) {
      let modelParam = options.model || 'flux';
      if (options.model === 'flux-realism') modelParam = 'flux-realism';
      else if (options.model === 'flux-anime') modelParam = 'flux-anime';
      else if (options.model === 'flux-3d') modelParam = 'flux-3d';
      else if (options.model === 'imagen-3') modelParam = 'flux';

      const encodedPrompt = encodeURIComponent(enhancedPrompt);
      finalImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${ratioConfig.width}&height=${ratioConfig.height}&model=${modelParam}&seed=${finalSeed}&nologo=true&enhance=false`;

      // Preload image
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        setTimeout(() => resolve(), 25000);
        img.src = finalImageUrl;
      });
    }

    const newImage: GeneratedImage = {
      id: crypto.randomUUID(),
      prompt: options.prompt,
      negativePrompt: options.negativePrompt,
      model: options.model,
      imageUrl: finalImageUrl,
      width: ratioConfig.width,
      height: ratioConfig.height,
      aspectRatio: options.aspectRatio,
      style: options.style,
      seed: finalSeed,
      createdAt: new Date().toISOString()
    };

    const currentImages = StorageService.getImages();
    StorageService.saveImages([newImage, ...currentImages]);

    return newImage;
  }
}
