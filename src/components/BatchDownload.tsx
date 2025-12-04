import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import JSZip from "jszip";

interface BatchDownloadProps {
  images: string[];
  className?: string;
}

const BatchDownload = ({ images, className = "" }: BatchDownloadProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleBatchDownload = async () => {
    if (images.length === 0) {
      toast.error("No images to download");
      return;
    }

    setIsDownloading(true);
    setProgress(0);

    try {
      const zip = new JSZip();
      const folder = zip.folder("selfie2snap-images");

      if (!folder) {
        throw new Error("Failed to create zip folder");
      }

      for (let i = 0; i < images.length; i++) {
        const imageUrl = images[i];
        
        try {
          // Handle base64 images
          if (imageUrl.startsWith("data:")) {
            const base64Data = imageUrl.split(",")[1];
            folder.file(`snap-${i + 1}.png`, base64Data, { base64: true });
          } else {
            // Fetch remote images
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            folder.file(`snap-${i + 1}.png`, blob);
          }
        } catch (err) {
          console.error(`Failed to add image ${i + 1}:`, err);
        }

        setProgress(Math.round(((i + 1) / images.length) * 100));
      }

      const content = await zip.generateAsync({ type: "blob" });
      
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `selfie2snap-batch-${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${images.length} images as ZIP!`);
    } catch (error) {
      console.error("Batch download error:", error);
      toast.error("Failed to create ZIP file");
    } finally {
      setIsDownloading(false);
      setProgress(0);
    }
  };

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={className}>
      <Button
        variant="outline"
        onClick={handleBatchDownload}
        disabled={isDownloading || images.length === 0}
        className="gap-2 relative overflow-hidden"
      >
        {isDownloading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{progress}%</span>
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </>
        ) : (
          <>
            <Package className="w-4 h-4" />
            <span>Download All ({images.length})</span>
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default BatchDownload;
