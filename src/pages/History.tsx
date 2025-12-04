import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import InteractiveBackground from "@/components/InteractiveBackground";
import BatchDownload from "@/components/BatchDownload";
import { ArrowLeft, Search, Download, Trash2, Calendar, ImageIcon, Package } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface GeneratedImage {
  id: string;
  image_url: string;
  prompt: string | null;
  created_at: string | null;
}

const History = () => {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      } else {
        fetchHistory();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      } else {
        fetchHistory();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("generated_images")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error: any) {
      console.error("Error fetching history:", error);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("generated_images")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setImages(images.filter(img => img.id !== id));
      toast.success("Image deleted");
    } catch (error: any) {
      toast.error("Failed to delete image");
    }
  };

  const handleDownload = (imageUrl: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `selfie2snap-${Date.now()}.png`;
    link.click();
    toast.success("Download started!");
  };

  const filteredImages = images.filter(img =>
    img.prompt?.toLowerCase().includes(search.toLowerCase()) || !search
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <InteractiveBackground />
      
      <div className="relative z-10 min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8 flex-wrap gap-4"
          >
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors glass px-4 py-2 rounded-full">
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
            
            {filteredImages.length > 0 && (
              <BatchDownload images={filteredImages.map(img => img.image_url)} />
            )}
          </motion.div>

          {/* Title */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">Generation History</h1>
            <p className="text-muted-foreground">View all your previously generated images</p>
            {images.length > 0 && (
              <p className="text-sm text-muted-foreground/60 mt-2">
                {images.length} image{images.length !== 1 ? "s" : ""} total
              </p>
            )}
          </motion.div>

          {/* Search */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-4 mb-8"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by style..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-secondary/50"
              />
            </div>
          </motion.div>

          {/* Content */}
          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading history...</p>
            </motion.div>
          ) : filteredImages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 glass rounded-2xl"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              </motion.div>
              <p className="text-xl text-muted-foreground">
                {search ? "No images match your search" : "No images generated yet"}
              </p>
              <p className="text-sm text-muted-foreground/60 mt-2">
                {search ? "Try a different search term" : "Start creating amazing snaps!"}
              </p>
              <Link to="/">
                <Button variant="premium" className="mt-6">
                  Create Your First Snap
                </Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {filteredImages.map((image, index) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass rounded-xl overflow-hidden group"
                  >
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={image.image_url}
                        alt={image.prompt || "Generated image"}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4 gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDownload(image.image_url)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(image.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-foreground font-medium truncate">
                        {image.prompt || "AI Generated Snap"}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/60">
                        <Calendar className="w-3 h-3" />
                        {image.created_at && format(new Date(image.created_at), "PPp")}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 glass border-t border-border/50 py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Created by <span className="font-semibold gradient-text">Nurash Weerasinghe</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default History;
