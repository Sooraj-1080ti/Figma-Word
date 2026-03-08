import React, { useRef, useEffect, useState, useCallback } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { RotateCcw, CheckCircle, Sparkles, Heart, Star, Zap, Flower, Music, Smile, Sun, BookHeart } from "lucide-react";
import { motion } from "motion/react";

interface WordTracingProps {
  word: string;
  onComplete: (word: string) => void;
  isCompleted: boolean;
}

const SAMPLE_SIZE = 150; 
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;

const WORD_CONFIG: Record<string, any> = {
  APPLE: { baseFreq: 261.63, color: "#ef4444", icon: Star, waveType: "triangle" as OscillatorType },
  ELEPHANT: { baseFreq: 293.66, color: "#f97316", icon: Heart, waveType: "sine" as OscillatorType },
  WATER: { baseFreq: 329.63, color: "#3b82f6", icon: Sun, waveType: "square" as OscillatorType },
  FOOD: { baseFreq: 392.00, color: "#22c55e", icon: Flower, waveType: "triangle" as OscillatorType },
  CAT: { baseFreq: 440.00, color: "#eab308", icon: Smile, waveType: "sine" as OscillatorType },
  DOG: { baseFreq: 523.25, color: "#8b5cf6", icon: Heart, waveType: "square" as OscillatorType },
  BIRD: { baseFreq: 587.33, color: "#06b6d4", icon: Music, waveType: "triangle" as OscillatorType },
  SUN: { baseFreq: 659.25, color: "#eab308", icon: Sun, waveType: "sine" as OscillatorType },
  MOON: { baseFreq: 783.99, color: "#94a3b8", icon: Star, waveType: "square" as OscillatorType },
  CAR: { baseFreq: 880.00, color: "#ef4444", icon: Zap, waveType: "triangle" as OscillatorType },
  HOUSE: { baseFreq: 1046.50, color: "#8b5cf6", icon: Heart, waveType: "sine" as OscillatorType },
  TREE: { baseFreq: 1174.66, color: "#22c55e", icon: Flower, waveType: "square" as OscillatorType },
  BOOK: { baseFreq: 1318.51, color: "#3b82f6", icon: BookHeart, waveType: "triangle" as OscillatorType },
  FISH: { baseFreq: 1567.98, color: "#06b6d4", icon: Sparkles, waveType: "sine" as OscillatorType },
  FLOWER: { baseFreq: 1760.00, color: "#ec4899", icon: Flower, waveType: "square" as OscillatorType },
};

export function WordTracing({ word, onComplete, isCompleted }: WordTracingProps) {
  const userCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingRef = useRef(false);

  const [showCelebration, setShowCelebration] = useState(false);
  const [progress, setProgress] = useState(0);
  const [canFinish, setCanFinish] = useState(false);
  const [isVibrating, setIsVibrating] = useState(false);
  const [sparkles, setSparkles] = useState<Array<{id: number; x: number; y: number; color: string; icon: React.ElementType<any>}>>([]);
  const sparkleIdRef = useRef(0);

  const audioContextRef = useRef<AudioContext | null>(null);

  const wordConfig = WORD_CONFIG[word] || WORD_CONFIG.APPLE;

  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const playDrawingSound = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") ctx.resume();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const variation = (Math.random() - 0.5) * 10;
    oscillator.frequency.setValueAtTime(wordConfig.baseFreq + variation, ctx.currentTime);
    oscillator.type = wordConfig.waveType;

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }, [wordConfig]);

  const playSuccessSound = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") ctx.resume();

    const baseFreq = wordConfig.baseFreq;
    const melody = [baseFreq * 0.8, baseFreq, baseFreq * 1.25, baseFreq * 1.5];

    melody.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.2);
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0, ctx.currentTime + index * 0.2);
      gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + index * 0.2 + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.2 + 0.5);

      oscillator.start(ctx.currentTime + index * 0.2);
      oscillator.stop(ctx.currentTime + index * 0.2 + 0.5);
    });
  }, [wordConfig]);

  const triggerHaptic = useCallback(() => {
    // Hardware vibration if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
    // Visual vibration trigger
    setIsVibrating(true);
    setTimeout(() => setIsVibrating(false), 50);
  }, []);

  const triggerSuccessHaptic = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
  }, []);

  const createWordSpecificSparkle = useCallback((x: number, y: number) => {
    const canvas = userCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sparkle = {
      id: sparkleIdRef.current++,
      x: x + rect.left,
      y: y + rect.top,
      color: wordConfig.color,
      icon: wordConfig.icon,
    };
    setSparkles((prev) => [...prev, sparkle]);
    setTimeout(() => setSparkles((prev) => prev.filter((s) => s.id !== sparkle.id)), 1500);
  }, [wordConfig]);

  const getFontSize = (w: string) => {
    const length = Math.max(w.length, 3);
    return Math.min(220, Math.floor(CANVAS_WIDTH / (length * 0.85)));
  };

  const drawMaskShape = useCallback((maskCtx: CanvasRenderingContext2D, w: string) => {
    maskCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    maskCtx.fillStyle = "black";
    maskCtx.font = `bold ${getFontSize(w)}px Arial`;
    maskCtx.textAlign = "center";
    maskCtx.textBaseline = "middle";
    maskCtx.fillText(w, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }, []);

  const drawWordTemplate = useCallback((ctx: CanvasRenderingContext2D, w: string) => {
    ctx.save();
    ctx.strokeStyle = wordConfig.color + "90";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.font = `bold ${getFontSize(w)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(w, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    ctx.setLineDash([]);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(50, 100); ctx.lineTo(CANVAS_WIDTH - 50, 100);
    ctx.moveTo(50, CANVAS_HEIGHT / 2); ctx.lineTo(CANVAS_WIDTH - 50, CANVAS_HEIGHT / 2);
    ctx.moveTo(50, 300); ctx.lineTo(CANVAS_WIDTH - 50, 300);
    ctx.stroke();
    ctx.restore();
  }, [wordConfig]);

  const setupCanvases = useCallback(() => {
    const user = userCanvasRef.current;
    const mask = maskCanvasRef.current;
    if (!user || !mask) return;

    if (!drawingCanvasRef.current) drawingCanvasRef.current = document.createElement("canvas");
    const drawing = drawingCanvasRef.current;
    const dpr = window.devicePixelRatio || 1;

    user.width = Math.round(CANVAS_WIDTH * dpr);
    user.height = Math.round(CANVAS_HEIGHT * dpr);
    user.style.width = `${CANVAS_WIDTH}px`;
    user.style.height = `${CANVAS_HEIGHT}px`;

    mask.width = Math.round(CANVAS_WIDTH * dpr);
    mask.height = Math.round(CANVAS_HEIGHT * dpr);
    mask.style.width = `${CANVAS_WIDTH}px`;
    mask.style.height = `${CANVAS_HEIGHT}px`;

    drawing.width = Math.round(CANVAS_WIDTH * dpr);
    drawing.height = Math.round(CANVAS_HEIGHT * dpr);

    const userCtx = user.getContext("2d");
    const maskCtx = mask.getContext("2d");
    const drawingCtx = drawing.getContext("2d");
    if (!userCtx || !maskCtx || !drawingCtx) return;

    userCtx.scale(dpr, dpr);
    userCtx.lineCap = "round";
    userCtx.lineJoin = "round";
    userCtx.strokeStyle = wordConfig.color;
    userCtx.lineWidth = 20;

    drawingCtx.scale(dpr, dpr);
    drawingCtx.lineCap = "round";
    drawingCtx.lineJoin = "round";
    drawingCtx.strokeStyle = wordConfig.color;
    drawingCtx.lineWidth = 20;

    maskCtx.scale(dpr, dpr);

    ctxRef.current = userCtx;
    drawingCtxRef.current = drawingCtx;

    userCtx.fillStyle = "#f8fafc";
    userCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawWordTemplate(userCtx, word);
    drawMaskShape(maskCtx, word);
  }, [word, wordConfig, drawWordTemplate, drawMaskShape]);

  useEffect(() => {
    setupCanvases();
    window.addEventListener("resize", setupCanvases);
    return () => window.removeEventListener("resize", setupCanvases);
  }, [setupCanvases]);

  const computeProgress = useCallback(() => {
    const mask = maskCanvasRef.current;
    const drawing = drawingCanvasRef.current;
    if (!mask || !drawing) return;

    const w = SAMPLE_SIZE;
    const h = SAMPLE_SIZE;
    const tmpMask = document.createElement("canvas");
    const tmpUser = document.createElement("canvas");
    tmpMask.width = w; tmpMask.height = h;
    tmpUser.width = w; tmpUser.height = h;

    const mctx = tmpMask.getContext("2d", { willReadFrequently: true })!;
    const uctx = tmpUser.getContext("2d", { willReadFrequently: true })!;

    mctx.drawImage(mask, 0, 0, w, h);
    uctx.drawImage(drawing, 0, 0, w, h);

    const maskData = mctx.getImageData(0, 0, w, h).data;
    const userData = uctx.getImageData(0, 0, w, h).data;

    let totalMaskPixels = 0;
    let overlappedPixels = 0;

    for (let i = 0; i < w * h; i++) {
        if (maskData[i * 4 + 3] > 40) {
            totalMaskPixels++;
            if (userData[i * 4 + 3] > 30) overlappedPixels++;
        }
    }

    const percent = totalMaskPixels === 0 ? 0 : (overlappedPixels / totalMaskPixels) * 100;
    const roundedPercent = Math.min(100, Math.round(percent));

    setProgress(roundedPercent);

    if (roundedPercent >= 70 && !canFinish) {
      setCanFinish(true);
    }
  }, [canFinish]);

  const getPos = useCallback((evt: PointerEvent) => {
    const canvas = userCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  }, []);

  const [lastDrawTime, setLastDrawTime] = useState(0);

  useEffect(() => {
    const canvas = userCanvasRef.current;
    const ctx = ctxRef.current;
    const drawingCtx = drawingCtxRef.current;
    if (!canvas || !ctx || !drawingCtx) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      canvas.setPointerCapture(e.pointerId);
      drawingRef.current = true;
      const p = getPos(e);
      ctx.beginPath(); ctx.moveTo(p.x, p.y);
      drawingCtx.beginPath(); drawingCtx.moveTo(p.x, p.y);

      if (audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume();
      }
      e.preventDefault();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!drawingRef.current) return;
      const p = getPos(e);
      ctx.lineTo(p.x, p.y); ctx.stroke();
      drawingCtx.lineTo(p.x, p.y); drawingCtx.stroke();

      const now = Date.now();
      if (now - lastDrawTime > 50) {
        playDrawingSound();
        triggerHaptic();
        if (Math.random() > 0.6) createWordSpecificSparkle(p.x, p.y);
        setLastDrawTime(now);
      }
      e.preventDefault();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
      computeProgress();
      e.preventDefault();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [getPos, playDrawingSound, triggerHaptic, createWordSpecificSparkle, computeProgress, lastDrawTime]);

  const handleFinish = () => {
    setShowCelebration(true);
    playSuccessSound();
    triggerSuccessHaptic();
    setTimeout(() => {
        onComplete(word);
    }, 2000);
  };

  const clearCanvas = () => {
    const user = userCanvasRef.current;
    const ctx = ctxRef.current;
    const drawingCtx = drawingCtxRef.current;
    if (!user || !ctx || !drawingCtx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawingCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawWordTemplate(ctx, word);

    setProgress(0);
    setCanFinish(false);
    setShowCelebration(false);
    setSparkles([]);
  };

  const WordIcon = wordConfig.icon;

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="p-6 bg-white/95 backdrop-blur-sm border-4 border-white/50 shadow-xl overflow-hidden">
        <div className="text-center mb-6">
          <motion.div
            className="flex items-center justify-center gap-3 mb-2"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <WordIcon className="w-8 h-8" style={{ color: wordConfig.color }} />
            </motion.div>
            <h2 className="text-4xl font-bold" style={{ color: wordConfig.color }}>
              Trace the Word "{word}"
            </h2>
            <motion.div animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }}>
              <WordIcon className="w-8 h-8" style={{ color: wordConfig.color }} />
            </motion.div>
          </motion.div>
          <p className="text-lg text-slate-700">
            Follow the dotted lines with your finger or mouse!
          </p>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-700 font-medium">Progress:</span>
            <span className="text-slate-700 font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-4">
            <motion.div
              className="h-4 rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(to right, ${wordConfig.color}, ${wordConfig.color}dd)`,
              }}
              animate={{ boxShadow: progress > 0 ? `0 0 15px ${wordConfig.color}80` : "none" }}
            />
          </div>
        </div>

        <div className="relative flex justify-center mb-6 w-full overflow-x-auto">
          <canvas ref={maskCanvasRef} style={{ display: "none" }} />

          <canvas
            ref={userCanvasRef}
            className="border-4 rounded-lg shadow-lg bg-slate-50 touch-none max-w-full"
            style={{ borderColor: wordConfig.color, touchAction: "none" }}
          />

          {sparkles.map((sparkle) => {
            const SparkleIcon = sparkle.icon;
            return (
              <motion.div
                key={sparkle.id}
                className="absolute pointer-events-none"
                style={{ left: sparkle.x - 12, top: sparkle.y - 12 }}
                initial={{ scale: 0, rotate: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 0], rotate: 360, opacity: [0, 1, 0] }}
                transition={{ duration: 1.5 }}
              >
                <SparkleIcon className="w-6 h-6" style={{ color: sparkle.color }} />
              </motion.div>
            );
          })}

          {showCelebration && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-lg z-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center">
                <motion.div animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.1, 1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                </motion.div>
                <motion.h3
                  className="text-3xl font-bold text-green-600 mb-2"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🎉 Amazing Work! 🎉
                </motion.h3>
                <p className="text-lg text-green-600">You completed the word "{word}"!</p>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex justify-center gap-6 mt-4">
          <Button 
            onClick={clearCanvas} 
            variant="outline" 
            className="bg-white hover:bg-purple-50 text-purple-600 border-2 border-purple-300 font-bold shadow-sm px-8 py-6 rounded-full text-xl flex items-center transition-all hover:scale-105"
          >
            <RotateCcw className="w-6 h-6 mr-2" />
            Try Again
          </Button>

          {canFinish && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Button 
                onClick={handleFinish} 
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md px-8 py-6 rounded-full text-xl flex items-center transition-all hover:scale-105"
              >
                <Heart className="w-6 h-6 mr-2" />
                I'm Done! ✨
              </Button>
            </motion.div>
          )}
        </div>
      </Card>
    </div>
  );
}