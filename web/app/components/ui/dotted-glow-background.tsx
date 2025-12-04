"use client";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";

type DottedGlowBackgroundProps = {
  className?: string;
  gap?: number;
  radius?: number;
  color?: string;
  darkColor?: string;
  glowColor?: string;
  darkGlowColor?: string;
  colorLightVar?: string;
  colorDarkVar?: string;
  glowColorLightVar?: string;
  glowColorDarkVar?: string;
  opacity?: number;
  backgroundOpacity?: number;
  speedMin?: number;
  speedMax?: number;
  speedScale?: number;
};

export const DottedGlowBackground = ({
  className,
  gap = 12,
  radius = 2,
  color = "rgba(0,0,0,0.7)",
  darkColor,
  glowColor = "rgba(0, 170, 255, 0.85)",
  darkGlowColor,
  colorLightVar,
  colorDarkVar,
  glowColorLightVar,
  glowColorDarkVar,
  opacity = 0.6,
  backgroundOpacity = 0,
  speedMin = 0.4,
  speedMax = 1.3,
  speedScale = 1,
}: DottedGlowBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dotsRef = useRef<{ x: number; y: number; phase: number; speed: number }[]>([]);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  const [resolvedColor, setResolvedColor] = useState<string>(color);
  const [resolvedGlowColor, setResolvedGlowColor] = useState<string>(glowColor);

  // Memoize CSS variable resolution function
  const resolveCssVariable = useCallback((el: Element, variableName?: string): string | null => {
    if (!variableName) return null;
    const normalized = variableName.startsWith("--") ? variableName : `--${variableName}`;
    const fromEl = getComputedStyle(el).getPropertyValue(normalized).trim();
    if (fromEl) return fromEl;
    const fromRoot = getComputedStyle(document.documentElement).getPropertyValue(normalized).trim();
    return fromRoot || null;
  }, []);

  // Memoize dark mode detection
  const detectDarkMode = useCallback((): boolean => {
    const root = document.documentElement;
    if (root.classList.contains("dark")) return true;
    if (root.classList.contains("light")) return false;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  }, []);

  // Color resolution effect
  useEffect(() => {
    const container = containerRef.current ?? document.documentElement;
    
    const compute = () => {
      const isDark = detectDarkMode();
      let nextColor: string = color;
      let nextGlow: string = glowColor;

      if (isDark) {
        const varDot = resolveCssVariable(container, colorDarkVar);
        const varGlow = resolveCssVariable(container, glowColorDarkVar);
        nextColor = varDot || darkColor || nextColor;
        nextGlow = varGlow || darkGlowColor || nextGlow;
      } else {
        const varDot = resolveCssVariable(container, colorLightVar);
        const varGlow = resolveCssVariable(container, glowColorLightVar);
        nextColor = varDot || nextColor;
        nextGlow = varGlow || nextGlow;
      }

      setResolvedColor(nextColor);
      setResolvedGlowColor(nextGlow);
    };

    compute();

    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    const handleMql = () => compute();
    mql?.addEventListener("change", handleMql);

    const mo = new MutationObserver(compute);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      mql?.removeEventListener("change", handleMql);
      mo.disconnect();
    };
  }, [
    color, darkColor, glowColor, darkGlowColor,
    colorLightVar, colorDarkVar, glowColorLightVar, glowColorDarkVar,
    detectDarkMode, resolveCssVariable
  ]);

  // Main animation effect
  useEffect(() => {
    const el = canvasRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    const ctx = el.getContext("2d", { alpha: true });
    if (!ctx) return;

    let stopped = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      el.width = Math.floor(width * dpr);
      el.height = Math.floor(height * dpr);
      el.style.width = `${Math.floor(width)}px`;
      el.style.height = `${Math.floor(height)}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Regenerate dots based on viewport
    const regenDots = () => {
      const { width, height } = container.getBoundingClientRect();
      const cols = Math.ceil(width / gap) + 1;
      const rows = Math.ceil(height / gap) + 1;
      const min = Math.min(speedMin, speedMax);
      const max = Math.max(speedMin, speedMax);
      const span = max - min;
      
      dotsRef.current = [];
      
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * gap + (j % 2 === 0 ? 0 : gap * 0.5);
          const y = j * gap;
          const phase = Math.random() * Math.PI * 2;
          const speed = min + Math.random() * span;
          dotsRef.current.push({ x, y, phase, speed });
        }
      }
    };

    const ro = new ResizeObserver(() => {
      resize();
      regenDots();
    });
    ro.observe(container);
    
    resize();
    regenDots();

    // Optimized draw loop
    const draw = (now: number) => {
      if (stopped) return;

      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const { width, height } = container.getBoundingClientRect();
      
      ctx.clearRect(0, 0, width, height);

      // Background gradient (if enabled)
      if (backgroundOpacity > 0) {
        ctx.globalAlpha = Math.min(backgroundOpacity, 1);
        const grad = ctx.createRadialGradient(
          width * 0.5, height * 0.4, Math.min(width, height) * 0.1,
          width * 0.5, height * 0.5, Math.max(width, height) * 0.7
        );
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, "rgba(0,0,0,1)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw dots with batching
      ctx.fillStyle = resolvedColor;
      const time = (now / 1000) * speedScale;
      const dots = dotsRef.current;
      
      // Batch dots by brightness to reduce state changes
      const brightDots: Array<{ x: number; y: number; a: number; glow: number }> = [];
      const dimDots: Array<{ x: number; y: number; a: number }> = [];
      
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const mod = (time * d.speed + d.phase) % 2;
        const lin = mod < 1 ? mod : 2 - mod;
        const a = 0.25 + 0.55 * lin;
        
        if (a > 0.6) {
          brightDots.push({ x: d.x, y: d.y, a, glow: (a - 0.6) / 0.4 });
        } else {
          dimDots.push({ x: d.x, y: d.y, a });
        }
      }

      // Draw dim dots (no shadow)
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      for (let i = 0; i < dimDots.length; i++) {
        const d = dimDots[i];
        ctx.globalAlpha = d.a * opacity;
        ctx.beginPath();
        ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw bright dots (with shadow)
      ctx.shadowColor = resolvedGlowColor;
      for (let i = 0; i < brightDots.length; i++) {
        const d = brightDots[i];
        ctx.shadowBlur = 6 * d.glow;
        ctx.globalAlpha = d.a * opacity;
        ctx.beginPath();
        ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      stopped = true;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [gap, radius, resolvedColor, resolvedGlowColor, opacity, backgroundOpacity, speedMin, speedMax, speedScale]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "absolute", inset: 0 }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
};