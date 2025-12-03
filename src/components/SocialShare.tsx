import { motion } from "framer-motion";
import { Twitter, Facebook, Instagram, Share2, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

interface SocialShareProps {
  imageUrl: string;
  title?: string;
}

const SocialShare = ({ imageUrl, title = "Check out my AI-generated snap!" }: SocialShareProps) => {
  const [copied, setCopied] = useState(false);

  const shareToTwitter = () => {
    const text = encodeURIComponent(title);
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
      "width=600,height=400"
    );
    toast.success("Opening Twitter...");
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank",
      "width=600,height=400"
    );
    toast.success("Opening Facebook...");
  };

  const shareToInstagram = () => {
    // Instagram doesn't have a direct share URL, so we copy the image
    toast.info("Download the image and share it on Instagram!");
    handleDownloadForShare();
  };

  const handleDownloadForShare = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `selfie2snap-${Date.now()}.png`;
    link.click();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Selfie2Snap",
          text: title,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      copyLink();
    }
  };

  const buttons = [
    { icon: Twitter, onClick: shareToTwitter, label: "Twitter", color: "hover:bg-[#1DA1F2]/20 hover:text-[#1DA1F2]" },
    { icon: Facebook, onClick: shareToFacebook, label: "Facebook", color: "hover:bg-[#4267B2]/20 hover:text-[#4267B2]" },
    { icon: Instagram, onClick: shareToInstagram, label: "Instagram", color: "hover:bg-[#E4405F]/20 hover:text-[#E4405F]" },
    { icon: copied ? Check : Link2, onClick: copyLink, label: "Copy Link", color: "hover:bg-primary/20 hover:text-primary" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={nativeShare}
        className="gap-2"
      >
        <Share2 className="w-4 h-4" />
        <span className="hidden sm:inline">Share</span>
      </Button>
      
      <div className="flex items-center gap-1">
        {buttons.map((btn, index) => (
          <motion.div
            key={btn.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={btn.onClick}
              className={`h-8 w-8 rounded-full transition-all ${btn.color}`}
              title={btn.label}
            >
              <btn.icon className="w-4 h-4" />
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default SocialShare;
