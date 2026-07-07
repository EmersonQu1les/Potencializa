/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';

interface CompassProps {
  size?: number;
  spinning?: boolean;
  pulse?: boolean;
}

export default function CompassAnimation({ size = 160, spinning = false, pulse = true }: CompassProps) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Outer Glow Ring */}
      <motion.div
        className="absolute inset-0 rounded-full bg-[#F27D26]/5 blur-xl"
        animate={pulse ? {
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.6, 0.3],
        } : {}}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Decorative Outer Compass Frame */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        className="text-zinc-700/80 absolute select-none pointer-events-none"
      >
        {/* Outer dotted circle */}
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />
        {/* Outer solid line */}
        <circle
          cx="100"
          cy="100"
          r="84"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-zinc-600"
        />
        {/* Degree notches */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 100 + 76 * Math.cos(angle);
          const y1 = 100 + 76 * Math.sin(angle);
          const x2 = 100 + 84 * Math.cos(angle);
          const y2 = 100 + 84 * Math.sin(angle);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={i % 3 === 0 ? "2" : "1"}
              className={i % 3 === 0 ? "text-[#F27D26]/60" : "text-zinc-700"}
            />
          );
        })}
        {/* Cardinal Directions */}
        <text x="100" y="32" textAnchor="middle" fontSize="10" className="fill-[#F27D26]/70 font-mono tracking-wider">N</text>
        <text x="100" y="180" textAnchor="middle" fontSize="10" className="fill-zinc-600 font-mono">S</text>
        <text x="172" y="103" textAnchor="middle" fontSize="10" className="fill-zinc-600 font-mono">E</text>
        <text x="28" y="103" textAnchor="middle" fontSize="10" className="fill-zinc-600 font-mono">W</text>
      </svg>

      {/* Rotating Inner Core & Needle */}
      <motion.div
        className="relative flex items-center justify-center"
        style={{ width: size - 40, height: size - 40 }}
        animate={
          spinning
            ? { rotate: 1440 }
            : { rotate: [0, 15, -10, 5, 0] }
        }
        transition={
          spinning
            ? { duration: 2.5, ease: "easeInOut" }
            : { duration: 6, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }
        }
      >
        {/* Inner metal dial */}
        <svg viewBox="0 0 120 120" className="w-full h-full text-zinc-800">
          <circle
            cx="60"
            cy="60"
            r="48"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          {/* North needle tip (Amber, active) */}
          <path
            d="M 60,15 L 68,60 L 60,54 Z"
            fill="url(#amberGrad)"
            className="filter drop-shadow-[0_2px_4px_rgba(242,125,38,0.4)]"
          />
          {/* South needle tip (Dark slate) */}
          <path
            d="M 60,105 L 68,60 L 60,66 Z"
            fill="currentColor"
            className="text-zinc-600"
          />
          {/* East/West indicator helpers */}
          <path
            d="M 60,60 L 52,60 L 60,54 Z"
            fill="currentColor"
            className="text-zinc-700"
          />
          <path
            d="M 60,60 L 68,60 L 60,66 Z"
            fill="currentColor"
            className="text-zinc-700"
          />
          
          {/* Center pivot pin */}
          <circle cx="60" cy="60" r="4" fill="#F27D26" />
          <circle cx="60" cy="60" r="1.5" fill="#18181b" />

          <defs>
            <linearGradient id="amberGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F27D26" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  );
}
