import React, { useState, useRef, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Star, Sparkles, Heart, Zap, Disc, Crown, Ghost, Rocket, Smile } from 'lucide-react';

const RightBanner = (props) => {
    const item = props?.data?.[0];

    const containerRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    // Base motion values for mouse position (-0.5 to 0.5)
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth springs for fluid movement
    const springConfig = { damping: 30, stiffness: 200, mass: 0.5 };
    const smoothX = useSpring(mouseX, springConfig);
    const smoothY = useSpring(mouseY, springConfig);

    // --- Layer Transforms (Different speeds for depth) ---
    const bgX = useTransform(smoothX, [-0.5, 0.5], [-15, 15]);
    const bgY = useTransform(smoothY, [-0.5, 0.5], [-15, 15]);

    const midX = useTransform(smoothX, [-0.5, 0.5], [-40, 40]);
    const midY = useTransform(smoothY, [-0.5, 0.5], [-40, 40]);

    const mainX = useTransform(smoothX, [-0.5, 0.5], [-70, 70]);
    const mainY = useTransform(smoothY, [-0.5, 0.5], [-70, 70]);
    const mainRotate = useTransform(smoothX, [-0.5, 0.5], [-8, 8]);

    const floatX = useTransform(smoothX, [-0.5, 0.5], [-120, 120]);
    const floatY = useTransform(smoothY, [-0.5, 0.5], [-120, 120]);

    const tiltX = useTransform(smoothY, [-0.5, 0.5], [12, -12]);
    const tiltY = useTransform(smoothX, [-0.5, 0.5], [-12, 12]);

    // Particles/Stickers data
    const stickers = useMemo(() => [
        { Icon: Crown, color: 'text-yellow-400', top: '15%', left: '10%', size: 32, delay: 0, xRange: [0, 30, -20, 10, 0], yRange: [0, -40, 20, -10, 0] },
        { Icon: Ghost, color: 'text-purple-400', top: '65%', left: '80%', size: 28, delay: 1, xRange: [0, -40, 20, -10, 0], yRange: [0, 50, -30, 10, 0] },
        { Icon: Rocket, color: 'text-blue-400', top: '40%', left: '85%', size: 24, delay: 0.5, xRange: [0, 50, -10, 20, 0], yRange: [0, -60, 20, -10, 0] },
        { Icon: Smile, color: 'text-pink-400', top: '80%', left: '15%', size: 36, delay: 1.5, xRange: [0, -30, 40, -10, 0], yRange: [0, -30, 50, -20, 0] },
        { Icon: Heart, color: 'text-red-400', top: '25%', left: '75%', size: 20, delay: 0.2, xRange: [0, 20, -30, 10, 0], yRange: [0, 40, -20, 10, 0] },
        { Icon: Zap, color: 'text-yellow-300', top: '50%', left: '5%', size: 24, delay: 0.8, xRange: [0, 25, -25, 15, 0], yRange: [0, 30, -30, 10, 0] },
        { Icon: Star, color: 'text-white', top: '10%', left: '90%', size: 18, delay: 1.2, xRange: [0, -20, 20, -10, 0], yRange: [0, 20, -20, 10, 0] },
    ], []);

    const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        mouseX.set(x);
        mouseY.set(y);
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
        setIsHovered(false);
    };

    return (
        <div className="w-full h-full font-sans overflow-hidden rounded-sm">
        <div className="perspective-[2000px] w-full ">
            <motion.div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX: tiltX,
                rotateY: tiltY,
            }}
            className="relative w-full h-full min-h-[500px] bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden   group cursor-none"
            >
            {/* LAYER 0: Deep Background */}
            <motion.div style={{ x: bgX, y: bgY, scale: 1.15 }} className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-white to-primary" />
                
                {/* Animated Floating Blobs */}
                <motion.div
                animate={{ 
                    x: [0, 100, 0], 
                    y: [0, -50, 0],
                    rotate: [0, 180, 360]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]"
                />
                <motion.div
                animate={{ 
                    x: [0, -80, 0], 
                    y: [0, 120, 0],
                    rotate: [360, 180, 0]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-0 right-0 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-[120px]"
                />
            </motion.div>

            {/* LAYER 1: Background Text / Marquee */}
            <motion.div style={{ x: midX, y: midY }} className="absolute inset-0 z-10 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] select-none">
                <h1 className="text-[clamp(7rem,15vw,14rem)] font-black text-white leading-none tracking-tighter rotate-[-15deg]">
                    FUN
                </h1>
                </div>
                
                {/* Scrolling Marquee */}
                <div className="absolute top-12 w-full overflow-hidden whitespace-nowrap opacity-30">
                <motion.div
                    animate={{ x: [0, -1000] }}
                    transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                    className="flex gap-8 text-[10px] font-black text-black tracking-[0.3em] uppercase"
                >
                    {Array(10).fill("LIMITED DROP • WORLD TOUR 2026 • IDOL STORE •").map((text, i) => (
                    <span key={i}>{text}</span>
                    ))}
                </motion.div>
                </div>
            </motion.div>

            {/* LAYER 2: Floating Stickers (Parallax + Drift) */}
            <motion.div style={{ x: floatX, y: floatY }} className="absolute inset-0 z-20 pointer-events-none">
                {stickers.map((sticker, i) => (
                <motion.div
                    key={i}
                    style={{ top: sticker.top, left: sticker.left }}
                    animate={{ 
                    x: sticker.xRange,
                    y: sticker.yRange,
                    rotate: [-15, 15, -15],
                    scale: isHovered ? 1.2 : 1
                    }}
                    transition={{ 
                    x: { duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: sticker.delay },
                    y: { duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: sticker.delay },
                    rotate: { duration: 6 + i, repeat: Infinity, ease: "easeInOut", delay: sticker.delay },
                    scale: { type: "spring", stiffness: 300, damping: 15 }
                    }}
                    className={`absolute ${sticker.color} drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
                >
                    <sticker.Icon size={sticker.size} strokeWidth={2.5} />
                </motion.div>
                ))}
            </motion.div>

            {/* LAYER 3: Main Product / Idol Image */}
            <motion.div
                style={{ x: mainX, y: mainY, rotate: mainRotate }}
                className="absolute inset-0 z-30 flex items-center justify-center p-6 lg:p-12 pointer-events-none"
            >
                <div className="relative w-[65%] sm:w-[75%] lg:w-full max-w-[280px] aspect-[3/4]">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-full h-full rounded-[2.5rem] overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] border border-white/10 relative"
                >
                    <img
                    src={item?.images[0]}
                    alt="Idol Merchandise"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    {/* Sparkle Particles on Image */}
                    <AnimatePresence>
                    {isHovered && Array(5).fill(0).map((_, i) => (
                        <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        style={{ 
                            top: `${Math.random() * 100}%`, 
                            left: `${Math.random() * 100}%` 
                        }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="absolute z-50 text-white"
                        >
                        <Sparkles size={16} className="animate-pulse" />
                        </motion.div>
                    ))}
                    </AnimatePresence>
                </motion.div>
                
                {/* Interactive Disc */}
                <motion.div
                    style={{ x: 40, y: -40 }}
                    animate={{ rotate: isHovered ? 360 : 0 }}
                    transition={{ duration: isHovered ? 2 : 10, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-10 -right-10 z-40"
                >
                    <div className="relative">
                    <Disc size={80} className="text-white/20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 bg-white/10 rounded-full border border-white/20" />
                    </div>
                    </div>
                </motion.div>
                </div>
            </motion.div>

            {/* LAYER 4: Floating UI (Fastest) */}
            <motion.div
                style={{ x: floatX, y: floatY }}
                className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between p-10"
            >
                <div className="flex justify-between items-start">
                
                <div className="flex flex-col items-end gap-3"></div>
                </div>

                <div className="space-y-3 sm:space-y-6">
                    <div className="space-y-1 sm:space-y-2">
                        <h3 className="text-white text-[10px] sm:text-xs font-black tracking-[0.3em] uppercase">Season 01 Drop</h3>
                        <h2 className="text-white text-[clamp(2.5rem,8vw,4rem)] font-black leading-[0.9] tracking-tighter">
                        {item?.bannerTitle || "NEON GALAXY"}
                        </h2>
                    </div>
                </div>
            </motion.div>

            {/* Custom Cursor Glow */}
            <motion.div
                className="pointer-events-none absolute z-[100] w-48 h-48 bg-white/10 rounded-full blur-[80px]"
                animate={{
                x: mousePos.x - 96,
                y: mousePos.y - 96,
                scale: isHovered ? 1.5 : 1,
                opacity: isHovered ? 1 : 0.5
                }}
                transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.5 }}
            />

            {/* Flash Effect on Hover */}
            <AnimatePresence>
                {isHovered && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.05 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white pointer-events-none z-[110]"
                />
                )}
            </AnimatePresence>

            {/* Border Highlight */}
            <div className="absolute inset-0 rounded-[2.5rem] border border-white/10 pointer-events-none z-[120]" />
            </motion.div>
        </div>
        </div>
    );
};

export default RightBanner;
