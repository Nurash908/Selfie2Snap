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
  Save,
  Trash2,
  Bookmark,
  Instagram,
  Copyright,
  AtSign,
  Sparkles,
  Plus,
  RotateCw,
  AlignLeft,
  Gem,
  Palette,
} from "lucide-react";

interface WatermarkEditorProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

type Position = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";

interface WatermarkPreset {
  id: string;
  name: string;
  text: string;
  position: Position;
  fontSize: number;
  opacity: number;
  color: string;
  fontFamily: string;
  rotation: number;
  icon: "social" | "copyright" | "brand" | "custom";
}

const FONT_FAMILIES = [
  { id: "inter", label: "Inter", value: "Inter, sans-serif" },
  { id: "playfair", label: "Playfair", value: "Playfair Display, serif" },
  { id: "roboto", label: "Roboto", value: "Roboto, sans-serif" },
  { id: "dancing", label: "Script", value: "Dancing Script, cursive" },
  { id: "oswald", label: "Oswald", value: "Oswald, sans-serif" },
  { id: "montserrat", label: "Montserrat", value: "Montserrat, sans-serif" },
];

const DEFAULT_PRESETS: WatermarkPreset[] = [
  {
    id: "instagram",
    name: "Instagram Handle",
    text: "@yourhandle",
    position: "bottom-right",
    fontSize: 20,
    opacity: 80,
    color: "#ffffff",
    fontFamily: "Inter, sans-serif",
    rotation: 0,
    icon: "social",
  },
  {
    id: "copyright",
    name: "Copyright Notice",
    text: "© 2024 Your Name",
    position: "bottom-left",
    fontSize: 16,
    opacity: 60,
    color: "#ffffff",
    fontFamily: "Inter, sans-serif",
    rotation: 0,
    icon: "copyright",
  },
  {
    id: "brand",
    name: "Brand Watermark",
    text: "Selfie2Snap",
    position: "bottom-right",
    fontSize: 24,
    opacity: 70,
    color: "#a855f7",
    fontFamily: "Montserrat, sans-serif",
    rotation: 0,
    icon: "brand",
  },
  {
    id: "diagonal",
    name: "Diagonal Signature",
    text: "Created with ♥",
    position: "center",
    fontSize: 28,
    opacity: 40,
    color: "#ffffff",
    fontFamily: "Dancing Script, cursive",
    rotation: -15,
    icon: "custom",
  },
];

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
  { id: "gold", value: "#fbbf24", label: "Gold" },
];

const getPresetIcon = (icon: string) => {
  switch (icon) {
    case "social":
      return <Instagram className="w-4 h-4" />;
    case "copyright":
      return <Copyright className="w-4 h-4" />;
    case "brand":
      return <Sparkles className="w-4 h-4" />;
    default:
      return <AtSign className="w-4 h-4" />;
  }
};

const WatermarkEditor = ({ imageUrl, isOpen, onClose }: WatermarkEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState("Selfie2Snap");
  const [position, setPosition] = useState<Position>("bottom-right");
  const [fontSize, setFontSize] = useState(24);
  const [opacity, setOpacity] = useState(70);
  const [color, setColor] = useState("#ffffff");
  const [fontFamily, setFontFamily] = useState("Inter, sans-serif");
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [presets, setPresets] = useState<WatermarkPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [activeTab, setActiveTab] = useState<"presets" | "customize">("presets");

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Oswald:wght@400;700&family=Montserrat:wght@400;700&family=Playfair+Display:wght@400;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  // Load saved presets and preferences
  useEffect(() => {
    const savedPresets = localStorage.getItem("watermark-presets");
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets));
      } catch (e) {
        console.error("Failed to load presets");
      }
    }

    const saved = localStorage.getItem("watermark-preferences");
    if (saved) {
      try {
        const prefs = JSON.parse(saved);
        setText(prefs.text || "Selfie2Snap");
        setPosition(prefs.position || "bottom-right");
        setFontSize(prefs.fontSize || 24);
        setOpacity(prefs.opacity || 70);
        setColor(prefs.color || "#ffffff");
        setFontFamily(prefs.fontFamily || "Inter, sans-serif");
        setRotation(prefs.rotation || 0);
      } catch (e) {
        console.error("Failed to load watermark preferences");
      }
    }
  }, []);

  // Save preferences
  const savePreferences = useCallback(() => {
    localStorage.setItem(
      "watermark-preferences",
      JSON.stringify({ text, position, fontSize, opacity, color, fontFamily, rotation })
    );
  }, [text, position, fontSize, opacity, color, fontFamily, rotation]);

  // Apply preset
  const applyPreset = (preset: WatermarkPreset) => {
    setText(preset.text);
    setPosition(preset.position);
    setFontSize(preset.fontSize);
    setOpacity(preset.opacity);
    setColor(preset.color);
    setFontFamily(preset.fontFamily || "Inter, sans-serif");
    setRotation(preset.rotation || 0);
    setSelectedPreset(preset.id);
  };

  // Save custom preset
  const saveCustomPreset = () => {
    if (!newPresetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }

    const newPreset: WatermarkPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName,
      text,
      position,
      fontSize,
      opacity,
      color,
      fontFamily,
      rotation,
      icon: "custom",
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem("watermark-presets", JSON.stringify(updatedPresets));
    setNewPresetName("");
    setShowSaveDialog(false);
    toast.success("Preset saved!");
  };

  // Delete custom preset
  const deletePreset = (presetId: string) => {
    const updatedPresets = presets.filter((p) => p.id !== presetId);
    setPresets(updatedPresets);
    localStorage.setItem("watermark-presets", JSON.stringify(updatedPresets));
    if (selectedPreset === presetId) {
      setSelectedPreset(null);
    }
    toast.success("Preset deleted");
  };

  // Draw watermark preview with multi-line support
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

      ctx.drawImage(img, 0, 0);

      // Split text into lines
      const lines = text.split("\n");
      const lineHeight = fontSize * 1.3;

      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity / 100;

      const padding = 30;
      
      // Calculate total text block dimensions
      let maxWidth = 0;
      lines.forEach((line) => {
        const metrics = ctx.measureText(line);
        maxWidth = Math.max(maxWidth, metrics.width);
      });
      const totalHeight = lineHeight * lines.length;

      let baseX: number, baseY: number;

      switch (position) {
        case "top-left":
          baseX = padding + maxWidth / 2;
          baseY = padding + fontSize;
          break;
        case "top-right":
          baseX = canvas.width - padding - maxWidth / 2;
          baseY = padding + fontSize;
          break;
        case "bottom-left":
          baseX = padding + maxWidth / 2;
          baseY = canvas.height - padding - totalHeight + fontSize;
          break;
        case "bottom-right":
          baseX = canvas.width - padding - maxWidth / 2;
          baseY = canvas.height - padding - totalHeight + fontSize;
          break;
        case "center":
          baseX = canvas.width / 2;
          baseY = canvas.height / 2 - totalHeight / 2 + fontSize;
          break;
        default:
          baseX = canvas.width - padding - maxWidth / 2;
          baseY = canvas.height - padding - totalHeight + fontSize;
      }

      // Apply rotation
      ctx.save();
      ctx.translate(baseX, baseY + totalHeight / 2 - fontSize);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-baseX, -(baseY + totalHeight / 2 - fontSize));

      // Draw shadow
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      // Draw each line
      ctx.textAlign = "center";
      lines.forEach((line, index) => {
        ctx.fillText(line, baseX, baseY + index * lineHeight);
      });

      ctx.restore();
    };
    img.src = imageUrl;
  }, [imageUrl, text, position, fontSize, opacity, color, fontFamily, rotation]);

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
    setFontFamily("Inter, sans-serif");
    setRotation(0);
    setSelectedPreset(null);
  };

  const allPresets = [...DEFAULT_PRESETS, ...presets];

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
                  <Type className="w-6 h-6 text-primary-foreground" />
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold">Watermark Studio</h2>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Gem className="w-3 h-3 text-accent" />
                    Professional watermarking
                  </p>
                </div>
              </div>
              <div className="relative flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2 rounded-xl">
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
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  Live Preview
                </div>
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary/30 border border-border/50 shadow-xl">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-5">
                {/* Tabs */}
                <div className="flex gap-1 p-1 rounded-xl bg-secondary/50">
                  <button
                    onClick={() => setActiveTab("presets")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      activeTab === "presets"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Bookmark className="w-4 h-4" />
                    Presets
                  </button>
                  <button
                    onClick={() => setActiveTab("customize")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      activeTab === "customize"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Palette className="w-4 h-4" />
                    Customize
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {activeTab === "presets" ? (
                    <motion.div
                      key="presets"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Quick presets</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 rounded-lg"
                          onClick={() => setShowSaveDialog(true)}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Save Current
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                        {allPresets.map((preset) => (
                          <motion.div
                            key={preset.id}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative p-3 rounded-xl cursor-pointer transition-all group ${
                              selectedPreset === preset.id
                                ? "bg-primary/15 border-2 border-primary shadow-lg shadow-primary/20"
                                : "bg-secondary/30 border border-border/50 hover:border-primary/50 hover:bg-secondary/50"
                            }`}
                            onClick={() => applyPreset(preset)}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                  selectedPreset === preset.id
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-muted-foreground"
                                }`}
                              >
                                {getPresetIcon(preset.icon)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{preset.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{preset.text}</p>
                              </div>
                            </div>
                            {preset.id.startsWith("custom-") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deletePreset(preset.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            )}
                          </motion.div>
                        ))}
                      </div>

                      {/* Save Preset Dialog */}
                      <AnimatePresence>
                        {showSaveDialog && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3"
                          >
                            <Input
                              value={newPresetName}
                              onChange={(e) => setNewPresetName(e.target.value)}
                              placeholder="Preset name..."
                              className="bg-background/50"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="flex-1 rounded-lg"
                                onClick={() => setShowSaveDialog(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 rounded-lg"
                                onClick={saveCustomPreset}
                              >
                                <Save className="w-3.5 h-3.5 mr-1.5" />
                                Save
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="customize"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      {/* Text input - Multi-line */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium">
                          <AlignLeft className="w-4 h-4 text-primary" />
                          Watermark Text
                          <span className="text-xs text-muted-foreground ml-auto">(Use Enter for new line)</span>
                        </label>
                        <textarea
                          value={text}
                          onChange={(e) => {
                            setText(e.target.value);
                            setSelectedPreset(null);
                          }}
                          placeholder="Enter watermark text..."
                          rows={2}
                          className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>

                      {/* Font Family */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium">
                          <Type className="w-4 h-4 text-primary" />
                          Font Style
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {FONT_FAMILIES.map((font) => (
                            <button
                              key={font.id}
                              onClick={() => {
                                setFontFamily(font.value);
                                setSelectedPreset(null);
                              }}
                              className={`p-2 rounded-lg text-sm transition-all ${
                                fontFamily === font.value
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary/50 hover:bg-secondary"
                              }`}
                              style={{ fontFamily: font.value }}
                            >
                              {font.label}
                            </button>
                          ))}
                        </div>
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
                              onClick={() => {
                                setPosition(pos.id);
                                setSelectedPreset(null);
                              }}
                              className="text-xs rounded-lg"
                            >
                              {pos.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Font size & Rotation */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="flex items-center justify-between text-sm font-medium">
                            <span className="flex items-center gap-2">
                              <Type className="w-4 h-4 text-primary" />
                              Size
                            </span>
                            <span className="text-muted-foreground text-xs">{fontSize}px</span>
                          </label>
                          <Slider
                            value={[fontSize]}
                            onValueChange={([v]) => {
                              setFontSize(v);
                              setSelectedPreset(null);
                            }}
                            min={12}
                            max={72}
                            step={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center justify-between text-sm font-medium">
                            <span className="flex items-center gap-2">
                              <RotateCw className="w-4 h-4 text-primary" />
                              Rotation
                            </span>
                            <span className="text-muted-foreground text-xs">{rotation}°</span>
                          </label>
                          <Slider
                            value={[rotation]}
                            onValueChange={([v]) => {
                              setRotation(v);
                              setSelectedPreset(null);
                            }}
                            min={-45}
                            max={45}
                            step={5}
                          />
                        </div>
                      </div>

                      {/* Opacity */}
                      <div className="space-y-2">
                        <label className="flex items-center justify-between text-sm font-medium">
                          <span className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-primary" />
                            Opacity
                          </span>
                          <span className="text-muted-foreground text-xs">{opacity}%</span>
                        </label>
                        <Slider
                          value={[opacity]}
                          onValueChange={([v]) => {
                            setOpacity(v);
                            setSelectedPreset(null);
                          }}
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
                              onClick={() => {
                                setColor(c.value);
                                setSelectedPreset(null);
                              }}
                              className={`w-9 h-9 rounded-full border-2 transition-all ${
                                color === c.value
                                  ? "border-primary scale-110 shadow-lg"
                                  : "border-border/50 hover:border-primary/50"
                              }`}
                              style={{ backgroundColor: c.value }}
                              title={c.label}
                            />
                          ))}
                          <input
                            type="color"
                            value={color}
                            onChange={(e) => {
                              setColor(e.target.value);
                              setSelectedPreset(null);
                            }}
                            className="w-9 h-9 rounded-full cursor-pointer border-2 border-border/50"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Premium Footer */}
            <div className="flex items-center justify-between gap-3 p-5 border-t border-border/50 bg-gradient-to-r from-transparent via-secondary/20 to-transparent">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                className="gap-2 rounded-xl"
              >
                <Save className="w-4 h-4" />
                Save Preset
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="rounded-xl">
                  Cancel
                </Button>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleDownload}
                    disabled={isProcessing || !text}
                    className="gap-2 rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/25"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WatermarkEditor;
