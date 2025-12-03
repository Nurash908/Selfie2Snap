import { motion } from "framer-motion";
import { Camera, Sparkles, Wand2, Stars, Palette } from "lucide-react";

interface GeneratingAnimationProps {
  frameCount: number;
  currentFrame: number;
}

const funMessages = [
  "Mixing pixels with magic...",
  "Teaching AI about beauty...",
  "Sprinkling digital stardust...",
  "Crafting your masterpiece...",
  "Blending moments together...",
  "Adding a touch of wonder...",
  "Creating something special...",
  "Painting with light...",
];

const GeneratingAnimation = ({ frameCount, currentFrame }: GeneratingAnimationProps) => {
  const progress = ((currentFrame + 1) / frameCount) * 100;
  const message = funMessages[currentFrame % funMessages.length];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -50, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            <Sparkles className="w-4 h-4 text-primary/30" />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 text-center px-4">
        {/* Main animation container */}
        <div className="relative w-64 h-64 mx-auto mb-8">
          {/* Outer rotating ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-dashed border-primary/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />

          {/* Middle pulsing ring */}
          <motion.div
            className="absolute inset-4 rounded-full border-2 border-accent/40"
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Inner glowing core */}
          <motion.div
            className="absolute inset-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />

          {/* Central icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="relative"
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/30">
                <Wand2 className="w-12 h-12 text-primary-foreground" />
              </div>
              
              {/* Orbiting icons */}
              {[Camera, Stars, Palette].map((Icon, i) => (
                <motion.div
                  key={i}
                  className="absolute w-10 h-10 rounded-full bg-background/90 border border-border flex items-center justify-center shadow-lg"
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 4 + i,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{
                    transformOrigin: "center",
                    left: "50%",
                    top: "50%",
                    marginLeft: "-20px",
                    marginTop: "-20px",
                  }}
                >
                  <motion.div
                    animate={{ rotate: [0, -360] }}
                    transition={{ duration: 4 + i, repeat: Infinity, ease: "linear" }}
                    style={{
                      transform: `translateX(${60 + i * 15}px)`,
                    }}
                  >
                    <Icon className="w-4 h-4 text-primary" />
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Progress section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h3 className="text-2xl font-bold gradient-text">Creating Magic</h3>
          
          <motion.p
            key={message}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-muted-foreground"
          >
            {message}
          </motion.p>

          {/* Progress bar */}
          <div className="w-64 mx-auto">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Frame {currentFrame + 1} of {frameCount}</span>
              <span className="text-primary font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%]"
                initial={{ width: 0 }}
                animate={{ 
                  width: `${progress}%`,
                  backgroundPosition: ["0% 0%", "100% 0%"],
                }}
                transition={{ 
                  width: { duration: 0.5 },
                  backgroundPosition: { duration: 2, repeat: Infinity, ease: "linear" },
                }}
              />
            </div>
          </div>

          {/* Frame indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {[...Array(frameCount)].map((_, i) => (
              <motion.div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${
                  i <= currentFrame
                    ? "bg-gradient-to-r from-primary to-accent"
                    : "bg-secondary"
                }`}
                animate={i === currentFrame ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default GeneratingAnimation;
