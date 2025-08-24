import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  Layers, 
  Route, 
  Settings, 
  Share2,
  Bookmark
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingControlsProps {
  className?: string;
}

const FloatingControls = ({ className }: FloatingControlsProps) => {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Menu Button */}
      <Button
        variant="outline"
        size="lg"
        className="bg-surface/95 backdrop-blur-sm hover:bg-surface border-border/20 shadow-floating w-12 h-12 rounded-full p-0"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Layer Toggle */}
      <Button
        variant="outline"
        size="lg"
        className="bg-surface/95 backdrop-blur-sm hover:bg-surface border-border/20 shadow-floating w-12 h-12 rounded-full p-0"
      >
        <Layers className="w-5 h-5" />
      </Button>

      {/* Route Planning */}
      <Button
        variant="outline"
        size="lg"
        className="bg-surface/95 backdrop-blur-sm hover:bg-surface border-border/20 shadow-floating w-12 h-12 rounded-full p-0"
      >
        <Route className="w-5 h-5" />
      </Button>

      {/* Bookmarks */}
      <Button
        variant="outline"
        size="lg"
        className="bg-surface/95 backdrop-blur-sm hover:bg-surface border-border/20 shadow-floating w-12 h-12 rounded-full p-0"
      >
        <Bookmark className="w-5 h-5" />
      </Button>

      {/* Share */}
      <Button
        variant="outline"
        size="lg"
        className="bg-surface/95 backdrop-blur-sm hover:bg-surface border-border/20 shadow-floating w-12 h-12 rounded-full p-0"
      >
        <Share2 className="w-5 h-5" />
      </Button>

      {/* Settings */}
      <Button
        variant="outline"
        size="lg"
        className="bg-surface/95 backdrop-blur-sm hover:bg-surface border-border/20 shadow-floating w-12 h-12 rounded-full p-0"
      >
        <Settings className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default FloatingControls;