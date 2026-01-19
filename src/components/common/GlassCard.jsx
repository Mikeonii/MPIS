import React from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ui/ThemeContext';

export default function GlassCard({ children, className, hover = false, onClick }) {
  const { darkMode } = useTheme();
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "rounded-2xl border backdrop-blur-xl transition-all duration-300",
        darkMode 
          ? "bg-gray-900/70 border-gray-700/50 shadow-lg shadow-black/20" 
          : "bg-white/70 border-white/50 shadow-lg shadow-gray-200/50",
        hover && "cursor-pointer hover:scale-[1.02] hover:shadow-xl",
        className
      )}
    >
      {children}
    </div>
  );
}