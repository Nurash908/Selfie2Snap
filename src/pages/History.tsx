import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import InteractiveBackground from "@/components/InteractiveBackground";
import BatchDownload from "@/components/BatchDownload";
import LazyImage from "@/components/LazyImage";
import WatermarkEditor from "@/components/WatermarkEditor";
import { Skeleton, SkeletonGrid } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Search, 
  Download, 
  Trash2, 
  Calendar, 
  ImageIcon, 
  Grid3X3, 
  List,
  SortAsc,
  SortDesc,
  Filter,
  Type,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isThisWeek, isThisMonth } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface GeneratedImage {
  id: string;
  image_url: string;
  prompt: string | null;
  created_at: string | null;
}

type ViewMode = "grid" | "list";
type SortOrder = "newest" | "oldest";
type DateFilter = "all" | "today" | "week" | "month";

const History = () => {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [watermarkImage, setWatermarkImage] = useState<string | null>(null);
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

  // Filter and sort logic
  const filteredImages = images
    .filter(img => {
      // Text search
      const matchesSearch = img.prompt?.toLowerCase().includes(search.toLowerCase()) || !search;
      
      // Date filter
      if (dateFilter === "all") return matchesSearch;
      if (!img.created_at) return false;
      
      const date = new Date(img.created_at);
      if (dateFilter === "today") return matchesSearch && isToday(date);
      if (dateFilter === "week") return matchesSearch && isThisWeek(date);
      if (dateFilter === "month") return matchesSearch && isThisMonth(date);
      
      return matchesSearch;
    })
    .sort((a, b) => {
      if (!a.created_at || !b.created_at) return 0;
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  const DATE_FILTERS: { id: DateFilter; label: string }[] = [
    { id: "all", label: "All Time" },
    { id: "today", label: "Today" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <InteractiveBackground />
      
      {/* Watermark Editor */}
      <AnimatePresence>
        {watermarkImage && (
          <WatermarkEditor
            imageUrl={watermarkImage}
            isOpen={!!watermarkImage}
            onClose={() => setWatermarkImage(null)}
          />
        )}
      </AnimatePresence>
      
      <div className="relative z-10 min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8 flex-wrap gap-4"
          >
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors glass px-4 py-2 rounded-full interactive-scale">
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
              <Sparkles className="w-4 h-4 text-accent animate-pulse" />
              <span className="text-sm font-medium">Your Creative Journey</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold gradient-text mb-2">Generation History</h1>
            <p className="text-muted-foreground">Browse and manage your AI-generated masterpieces</p>
            {images.length > 0 && (
              <p className="text-sm text-muted-foreground/60 mt-2">
                {images.length} image{images.length !== 1 ? "s" : ""} total • {filteredImages.length} showing
              </p>
            )}
          </motion.div>

          {/* Search & Filters */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-4 mb-8 space-y-4"
          >
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by style..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-secondary/50"
              />
            </div>
            
            {/* Filters row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Date filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <div className="flex gap-1">
                  {DATE_FILTERS.map((filter) => (
                    <Button
                      key={filter.id}
                      variant={dateFilter === filter.id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setDateFilter(filter.id)}
                      className="text-xs"
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex-1" />

              {/* Sort order */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
                className="gap-1"
              >
                {sortOrder === "newest" ? (
                  <SortDesc className="w-4 h-4" />
                ) : (
                  <SortAsc className="w-4 h-4" />
                )}
                {sortOrder === "newest" ? "Newest" : "Oldest"}
              </Button>

              {/* View mode toggle */}
              <div className="flex gap-1 glass rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          {loading ? (
            <SkeletonGrid count={6} />
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
                <ImageIcon className="w-20 h-20 mx-auto text-muted-foreground/20 mb-4" />
              </motion.div>
              <p className="text-xl text-muted-foreground font-medium">
                {search || dateFilter !== "all" ? "No images match your filters" : "No images generated yet"}
              </p>
              <p className="text-sm text-muted-foreground/60 mt-2 max-w-md mx-auto">
                {search || dateFilter !== "all" 
                  ? "Try adjusting your search or filter settings" 
                  : "Start creating stunning AI-generated portraits!"}
              </p>
              <Link to="/">
                <Button variant="premium" className="mt-6 gap-2">
                  <Sparkles className="w-4 h-4" />
                  Create Your First Snap
                </Button>
              </Link>
            </motion.div>
          ) : viewMode === "grid" ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredImages.map((image, index) => (
                  <motion.div
                    key={image.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.03 }}
                    className="glass rounded-xl overflow-hidden group card-hover-lift"
                  >
                    <div className="aspect-square relative overflow-hidden">
                      <LazyImage
                        src={image.image_url}
                        alt={image.prompt || "Generated image"}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        containerClassName="w-full h-full"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center p-4 gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setWatermarkImage(image.image_url)}
                          className="h-9 w-9 p-0"
                          title="Add Watermark"
                        >
                          <Type className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDownload(image.image_url)}
                          className="h-9 w-9 p-0"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(image.id)}
                          className="h-9 w-9 p-0"
                          title="Delete"
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
          ) : (
            // List view
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <AnimatePresence mode="popLayout">
                {filteredImages.map((image, index) => (
                  <motion.div
                    key={image.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.02 }}
                    className="glass rounded-xl overflow-hidden group flex items-center gap-4 p-3 card-hover-lift"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <LazyImage
                        src={image.image_url}
                        alt={image.prompt || "Generated image"}
                        className="w-full h-full object-cover"
                        containerClassName="w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {image.prompt || "AI Generated Snap"}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {image.created_at && format(new Date(image.created_at), "PPp")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setWatermarkImage(image.image_url)}
                        className="h-8 w-8 p-0"
                        title="Add Watermark"
                      >
                        <Type className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownload(image.image_url)}
                        className="h-8 w-8 p-0"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(image.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
