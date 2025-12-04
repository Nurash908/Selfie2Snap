import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Download, RotateCcw, Sun, Contrast, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface ImageFiltersProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImageFilters = ({ imageUrl, isOpen, onClose }: ImageFiltersProps) => {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const filters = [
    { name: "brightness", value: brightness, setValue: setBrightness, icon: Sun, label: "Brightness" },
    { name: "contrast", value: contrast, setValue: setContrast, icon: Contrast, label: "Contrast" },
    { name: "saturation", value: saturation, setValue: setSaturation, icon: Droplets, label: "Saturation" },
  ];

  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `selfie2snap-edited-${Date.now()}.png`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success("Edited image downloaded!");
        }
      }, "image/png");
    };
    img.src = imageUrl;
  };

  const filterStyle = {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col"
    >
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-xl font-bold gradient-text">Edit Image</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button variant="premium" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-auto">
        {/* Image preview */}
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            className="relative max-w-lg w-full aspect-square rounded-2xl overflow-hidden glass"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            <img
              src={imageUrl}
              alt="Edit preview"
              className="w-full h-full object-cover transition-all duration-200"
              style={filterStyle}
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </motion.div>
        </div>

        {/* Controls */}
        <div className="lg:w-80 space-y-6 glass rounded-2xl p-6">
          <h3 className="font-semibold text-lg mb-4">Adjustments</h3>

          {filters.map((filter) => (
            <div key={filter.name} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <filter.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{filter.label}</span>
                </div>
                <span className="text-sm text-muted-foreground glass px-2 py-1 rounded">
                  {filter.value}%
                </span>
              </div>
              <Slider
                value={[filter.value]}
                onValueChange={(v) => filter.setValue(v[0])}
                min={0}
                max={200}
                step={1}
              />
            </div>
          ))}

          {/* Presets */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-medium mb-3">Quick Presets</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: "Vivid", b: 105, c: 115, s: 130 },
                { name: "Muted", b: 100, c: 90, s: 70 },
                { name: "Warm", b: 105, c: 105, s: 110 },
                { name: "Cool", b: 100, c: 105, s: 90 },
                { name: "High Contrast", b: 100, c: 140, s: 100 },
                { name: "Soft", b: 110, c: 85, s: 95 },
              ].map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBrightness(preset.b);
                    setContrast(preset.c);
                    setSaturation(preset.s);
                  }}
                  className="text-xs"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ImageFilters;
