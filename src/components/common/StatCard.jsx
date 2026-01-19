import React from 'react';
import { useTheme } from '@/components/ui/ThemeContext';
import GlassCard from './GlassCard';

export default function StatCard({ icon: Icon, title, value, trend, trendUp }) {
  const { darkMode, currentTheme } = useTheme();
  
  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${currentTheme.primary}20` }}
          >
            <Icon 
              className="w-6 h-6" 
              style={{ color: currentTheme.primary }}
            />
          </div>
          <div>
            <p className={cn(
              "text-sm font-medium",
              darkMode ? "text-gray-400" : "text-gray-500"
            )}>
              {title}
            </p>
            <p className={cn(
              "text-2xl font-bold tracking-tight",
              darkMode ? "text-white" : "text-gray-900"
            )}>
              {value}
            </p>
          </div>
        </div>
        {trend && (
          <div className={cn(
            "text-sm font-medium px-2 py-1 rounded-lg",
            trendUp 
              ? "text-green-600 bg-green-100" 
              : "text-red-600 bg-red-100"
          )}>
            {trend}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}