import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  X,
  Download,
  Type,
  Move,
  Paintbrush,
  Eye,
  RotateCcw,
} from "lucide-react";

interface WatermarkEditorProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

type Position = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";

const POSITIONS: { id: Position; label: string }[] = [
  { id: "top-left", label: "Top Left" },
  { id: "top-right", label: "Top Right" },
  { id: "bottom-left", label: "Bottom Left" },
  { id: "bottom-right", label: "Bottom Right" },
  { id: "center", label: "Center" },
];

const COLORS = [
  { id: "white", value: "#ffffff", label: "White" },
  { id: "black", value: "#000000", label: "Black" },
  { id: "primary", value: "#a855f7", label: "Primary" },
  { id: "accent", value: "#ec4899", label: "Accent" },
];

const WatermarkEditor = ({ imageUrl, isOpen, onClose }: WatermarkEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState("Selfie2Snap");
  const [position, setPosition] = useState<Position>("bottom-right");
  const [fontSize, setFontSize] = useState(24);
  const [opacity, setOpacity] = useState(70);
  const [color, setColor] = useState("#ffffff");
  const [isProcessing, setIsProcessing] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem("watermark-preferences");
    if (saved) {
      try {
        const prefs = JSON.parse(saved);
        setText(prefs.text || "Selfie2Snap");
        setPosition(prefs.position || "bottom-right");
        setFontSize(prefs.fontSize || 24);
        setOpacity(prefs.opacity || 70);
        setColor(prefs.color || "#ffffff");
      } catch (e) {
        console.error("Failed to load watermark preferences");
      }
    }
  }, []);

  // Save preferences
  const savePreferences = useCallback(() => {
    localStorage.setItem(
      "watermark-preferences",
      JSON.stringify({ text, position, fontSize, opacity, color })
    );
  }, [text, position, fontSize, opacity, color]);

  // Draw watermark preview
  const drawWatermark = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Configure text
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity / 100;

      // Calculate position
      const padding = 20;
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;

      let x: number, y: number;

      switch (position) {
        case "top-left":
          x = padding;
          y = padding + textHeight;
          break;
        case "top-right":
          x = canvas.width - textWidth - padding;
          y = padding + textHeight;
          break;
        case "bottom-left":
          x = padding;
          y = canvas.height - padding;
          break;
        case "bottom-right":
          x = canvas.width - textWidth - padding;
          y = canvas.height - padding;
          break;
        case "center":
          x = (canvas.width - textWidth) / 2;
          y = canvas.height / 2 + textHeight / 2;
          break;
        default:
          x = canvas.width - textWidth - padding;
          y = canvas.height - padding;
      }

      // Draw shadow for better visibility
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillText(text, x, y);
    };
    img.src = imageUrl;
  }, [imageUrl, text, position, fontSize, opacity, color]);

  useEffect(() => {
    if (isOpen) {
      drawWatermark();
    }
  }, [isOpen, drawWatermark]);

  const handleDownload = async () => {
    if (!canvasRef.current) return;

    setIsProcessing(true);
    savePreferences();

    try {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `selfie2snap-watermarked-${Date.now()}.png`;
      link.click();
      toast.success("Downloaded with watermark!");
      onClose();
    } catch (error) {
      toast.error("Failed to download image");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setText("Selfie2Snap");
    setPosition("bottom-right");
    setFontSize(24);
    setOpacity(70);
    setColor("#ffffff");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card border border-border rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Type className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Add Watermark</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 p-4 max-h-[calc(90vh-140px)] overflow-y-auto">
              {/* Preview */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  Preview
                </div>
                <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary/50 border border-border">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-5">
                {/* Text input */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Type className="w-4 h-4 text-primary" />
                    Watermark Text
                  </label>
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter watermark text"
                    className="bg-secondary/50"
                  />
                </div>

                {/* Position */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Move className="w-4 h-4 text-primary" />
                    Position
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {POSITIONS.map((pos) => (
                      <Button
                        key={pos.id}
                        variant={position === pos.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPosition(pos.id)}
                        className="text-xs"
                      >
                        {pos.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Font size */}
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-primary" />
                      Font Size
                    </span>
                    <span className="text-muted-foreground">{fontSize}px</span>
                  </label>
                  <Slider
                    value={[fontSize]}
                    onValueChange={([v]) => setFontSize(v)}
                    min={12}
                    max={72}
                    step={2}
                  />
                </div>

                {/* Opacity */}
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-primary" />
                      Opacity
                    </span>
                    <span className="text-muted-foreground">{opacity}%</span>
                  </label>
                  <Slider
                    value={[opacity]}
                    onValueChange={([v]) => setOpacity(v)}
                    min={10}
                    max={100}
                    step={5}
                  />
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Paintbrush className="w-4 h-4 text-primary" />
                    Color
                  </label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setColor(c.value)}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          color === c.value
                            ? "border-primary scale-110"
                            : "border-border hover:border-primary/50"
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-10 h-10 rounded-full cursor-pointer border-2 border-border"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-border">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="premium"
                onClick={handleDownload}
                disabled={isProcessing || !text}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download with Watermark
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WatermarkEditor;
