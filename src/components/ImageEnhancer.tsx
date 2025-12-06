import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  X,
  Download,
  Sparkles,
  Sun,
  Contrast,
  Palette,
  Zap,
  RotateCcw,
  Loader2,
  Check,
  Wand2,
  Gem,
} from "lucide-react";

interface ImageEnhancerProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

interface EnhancementSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
  warmth: number;
  vibrance: number;
}

const DEFAULT_SETTINGS: EnhancementSettings = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpness: 0,
  warmth: 0,
  vibrance: 0,
};

const AUTO_ENHANCE_PRESETS = [
  {
    id: "auto",
    name: "AI Auto",
    icon: Wand2,
    description: "Smart enhancement",
    settings: { brightness: 5, contrast: 10, saturation: 8, sharpness: 15, warmth: 3, vibrance: 12 },
  },
  {
    id: "vivid",
    name: "Vivid",
    icon: Palette,
    description: "Bold colors",
    settings: { brightness: 3, contrast: 15, saturation: 25, sharpness: 10, warmth: -5, vibrance: 30 },
  },
  {
    id: "cinematic",
    name: "Cinematic",
    icon: Gem,
    description: "Film look",
    settings: { brightness: -3, contrast: 20, saturation: -10, sharpness: 8, warmth: 8, vibrance: -5 },
  },
  {
    id: "bright",
    name: "Bright",
    icon: Sun,
    description: "Light & airy",
    settings: { brightness: 15, contrast: 5, saturation: 5, sharpness: 5, warmth: 5, vibrance: 10 },
  },
];

const ImageEnhancer = ({ imageUrl, isOpen, onClose }: ImageEnhancerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const [settings, setSettings] = useState<EnhancementSettings>(DEFAULT_SETTINGS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isAutoEnhancing, setIsAutoEnhancing] = useState(false);

  // Load original image
  useEffect(() => {
    if (isOpen && imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        originalImageRef.current = img;
        applyEnhancements();
      };
      img.src = imageUrl;
    }
  }, [isOpen, imageUrl]);

  // Apply enhancements when settings change
  useEffect(() => {
    if (originalImageRef.current) {
      applyEnhancements();
    }
  }, [settings]);

  const applyEnhancements = useCallback(() => {
    const canvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;

    // Draw original image
    ctx.drawImage(img, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply enhancements
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Brightness
      const brightness = settings.brightness * 2.55;
      r += brightness;
      g += brightness;
      b += brightness;

      // Contrast
      const contrast = (settings.contrast + 100) / 100;
      r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
      g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
      b = ((b / 255 - 0.5) * contrast + 0.5) * 255;

      // Saturation
      const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
      const satFactor = (settings.saturation + 100) / 100;
      r = gray + satFactor * (r - gray);
      g = gray + satFactor * (g - gray);
      b = gray + satFactor * (b - gray);

      // Warmth (shift towards orange/yellow)
      const warmth = settings.warmth;
      r += warmth * 1.5;
      g += warmth * 0.5;
      b -= warmth * 1.5;

      // Vibrance (selective saturation)
      const vibrance = settings.vibrance / 100;
      const maxChannel = Math.max(r, g, b);
      const avgChannel = (r + g + b) / 3;
      const vibranceAmount = (maxChannel - avgChannel) / 255 * vibrance;
      r += (r - avgChannel) * vibranceAmount;
      g += (g - avgChannel) * vibranceAmount;
      b += (b - avgChannel) * vibranceAmount;

      // Clamp values
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    ctx.putImageData(imageData, 0, 0);

    // Apply sharpening
    if (settings.sharpness > 0) {
      applySharpening(ctx, canvas.width, canvas.height, settings.sharpness / 100);
    }
  }, [settings]);

  const applySharpening = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    amount: number
  ) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const tempData = new Uint8ClampedArray(data);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        for (let c = 0; c < 3; c++) {
          const center = tempData[idx + c];
          const neighbors =
            (tempData[((y - 1) * width + x) * 4 + c] +
              tempData[((y + 1) * width + x) * 4 + c] +
              tempData[(y * width + x - 1) * 4 + c] +
              tempData[(y * width + x + 1) * 4 + c]) /
            4;

          const sharpened = center + (center - neighbors) * amount;
          data[idx + c] = Math.max(0, Math.min(255, sharpened));
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const handleAutoEnhance = async () => {
    setIsAutoEnhancing(true);
    
    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Apply AI auto preset
    const autoPreset = AUTO_ENHANCE_PRESETS[0];
    setSettings(autoPreset.settings);
    setSelectedPreset("auto");
    setIsAutoEnhancing(false);
    
    toast.success("AI enhancement applied!");
  };

  const applyPreset = (preset: typeof AUTO_ENHANCE_PRESETS[0]) => {
    setSettings(preset.settings);
    setSelectedPreset(preset.id);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setSelectedPreset(null);
  };

  const handleDownload = async () => {
    if (!canvasRef.current) return;

    setIsProcessing(true);

    try {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `selfie2snap-enhanced-${Date.now()}.png`;
      link.click();
      toast.success("Enhanced image downloaded!");
      onClose();
    } catch (error) {
      toast.error("Failed to download image");
    } finally {
      setIsProcessing(false);
    }
  };

  const updateSetting = (key: keyof EnhancementSettings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSelectedPreset(null);
  };

  const sliderControls = [
    { key: "brightness" as const, label: "Brightness", icon: Sun, min: -50, max: 50 },
    { key: "contrast" as const, label: "Contrast", icon: Contrast, min: -50, max: 50 },
    { key: "saturation" as const, label: "Saturation", icon: Palette, min: -50, max: 50 },
    { key: "sharpness" as const, label: "Sharpness", icon: Zap, min: 0, max: 100 },
    { key: "warmth" as const, label: "Warmth", icon: Sun, min: -30, max: 30 },
    { key: "vibrance" as const, label: "Vibrance", icon: Sparkles, min: -50, max: 50 },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-gradient-to-b from-card to-card/95 border border-border/50 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Premium Header */}
            <div className="relative flex items-center justify-between p-5 border-b border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-accent/5">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 opacity-50" />
              <div className="relative flex items-center gap-3">
                <motion.div 
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-lg shadow-primary/25"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    AI Image Enhancer
                  </h2>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Gem className="w-3 h-3 text-accent" />
                    Professional-grade enhancements
                  </p>
                </div>
              </div>
              <div className="relative flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 p-6 max-h-[calc(90vh-180px)] overflow-y-auto">
              {/* Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Preview</span>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAutoEnhance}
                    disabled={isAutoEnhancing}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25 disabled:opacity-50"
                  >
                    {isAutoEnhancing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        AI Auto-Enhance
                      </>
                    )}
                  </motion.button>
                </div>
                
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary/30 border border-border/50 shadow-xl">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full object-contain"
                  />
                  {isAutoEnhancing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center"
                    >
                      <div className="text-center space-y-3">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-primary to-accent p-[2px]"
                        >
                          <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-primary" />
                          </div>
                        </motion.div>
                        <p className="text-sm font-medium">AI is analyzing your image...</p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Quick presets */}
                <div className="grid grid-cols-4 gap-2">
                  {AUTO_ENHANCE_PRESETS.map((preset) => (
                    <motion.button
                      key={preset.id}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => applyPreset(preset)}
                      className={`relative p-3 rounded-xl border transition-all ${
                        selectedPreset === preset.id
                          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                          : "border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <preset.icon className={`w-5 h-5 ${selectedPreset === preset.id ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-xs font-medium">{preset.name}</span>
                      </div>
                      {selectedPreset === preset.id && (
                        <motion.div
                          layoutId="preset-check"
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                        >
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-5">
                <div className="text-sm font-medium text-muted-foreground">Fine-tune</div>
                
                <div className="space-y-4">
                  {sliderControls.map((control) => (
                    <div key={control.key} className="space-y-2">
                      <label className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 font-medium">
                          <control.icon className="w-4 h-4 text-primary" />
                          {control.label}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-secondary text-xs font-mono">
                          {settings[control.key] > 0 ? "+" : ""}
                          {settings[control.key]}
                        </span>
                      </label>
                      <Slider
                        value={[settings[control.key]]}
                        onValueChange={([v]) => updateSetting(control.key, v)}
                        min={control.min}
                        max={control.max}
                        step={1}
                        className="cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Premium Footer */}
            <div className="flex justify-end gap-3 p-5 border-t border-border/50 bg-gradient-to-r from-transparent via-secondary/20 to-transparent">
              <Button variant="outline" onClick={onClose} className="rounded-xl">
                Cancel
              </Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleDownload}
                  disabled={isProcessing}
                  className="gap-2 min-w-[180px] rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/25"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download Enhanced
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageEnhancer;
