import { Heart, Download, Trash2, X, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import JSZip from "jszip";

interface FavoritesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const FavoritesPanel = ({ isOpen, onClose }: FavoritesPanelProps) => {
  const { favorites, loading, removeFromFavorites } = useFavorites();
  const { playSound } = useSoundEffects();
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const handleDownload = (imageUrl: string) => {
    playSound("download");
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `selfie2snap-favorite-${Date.now()}.png`;
    link.click();
    toast.success("Download started!");
  };

  const handleDownloadAll = async () => {
    if (favorites.length === 0) return;

    setIsDownloadingAll(true);
    playSound("download");

    try {
      const zip = new JSZip();
      const folder = zip.folder("selfie2snap-favorites");

      if (!folder) throw new Error("Failed to create folder");

      for (let i = 0; i < favorites.length; i++) {
        const fav = favorites[i];
        if (fav.image_url.startsWith("data:")) {
          const base64Data = fav.image_url.split(",")[1];
          folder.file(`favorite-${i + 1}.png`, base64Data, { base64: true });
        } else {
          try {
            const response = await fetch(fav.image_url);
            const blob = await response.blob();
            folder.file(`favorite-${i + 1}.png`, blob);
          } catch {
            console.error("Failed to fetch image:", fav.image_url);
          }
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `selfie2snap-favorites-${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${favorites.length} favorites as ZIP!`);
    } catch (error) {
      console.error("Batch download error:", error);
      toast.error("Failed to download favorites");
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handleRemove = async (id: string) => {
    const success = await removeFromFavorites(id);
    if (success) {
      playSound("click");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary fill-primary" />
                <h2 className="text-xl font-bold">Favorites</h2>
                <motion.span 
                  key={favorites.length}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full font-medium"
                >
                  {favorites.length}
                </motion.span>
              </div>
              <div className="flex items-center gap-2">
                {favorites.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadAll}
                    disabled={isDownloadingAll}
                    className="gap-1"
                  >
                    {isDownloadingAll ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Package className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">All</span>
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="h-[calc(100%-64px)] overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-12">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Heart className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  </motion.div>
                  <p className="text-muted-foreground">No favorites yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Click the heart icon on generated images to save them
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {favorites.map((favorite, index) => (
                    <motion.div
                      key={favorite.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative group rounded-xl overflow-hidden bg-secondary/50"
                    >
                      <div className="aspect-square">
                        <img
                          src={favorite.image_url}
                          alt="Favorite"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center gap-2 p-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDownload(favorite.image_url)}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemove(favorite.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FavoritesPanel;
