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
  onMenuClick?: () => void;
  onToggleLayers?: () => void;
  onRoutePlanning?: () => void;
  onBookmarks?: () => void;
  onShare?: () => void;
  onSettings?: () => void;
}

const FloatingControls = ({
  className,
  onMenuClick,
  onToggleLayers,
  onRoutePlanning,
  onBookmarks,
  onShare,
  onSettings,
}: FloatingControlsProps) => {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Menu Button */}
      <Button
        onClick={onMenuClick}
        variant="outline"
        size="lg"
        className="bg-surface/95 backdrop-blur-sm hover:bg-surface border-border/20 shadow-floating w-12 h-12 rounded-full p-0"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Layer Toggle */}
      <Button
        onClick={onToggleLayers}
        variant="outline"
        size="lg"
        className="bg-surface/95 backdrop-blur-sm hover:bg-surface border-border/20 shadow-floating w-12 h-12 rounded-full p-0"
      >
        <Layers className="w-5 h-5" />
      </Button>

      {/* Route Planning */}
      <Button
        onClick={onRoutePlanning}
        variant="outline"
        size="lg"
        className="bg-surface/95 backdrop-blur-sm hover:bg-surface border-border/20 shadow-floating w-12 h-12 rounded-full p-0"
      >
        <Route className="w-5 h-5" />
      </Button>

      {/* Bookmarks */}
      <Button
        onClick={onBookmarks}
        variant="outline"
        size="lg"
        className="bg-surface/95 backdrop-blur-sm hover:bg-surface border-border/20 shadow-floating w-12 h-12 rounded-full p-0"
      >
        <Bookmark className="w-5 h-5" />
      </Button>

      {/* Share */}
      <Button
        onClick={onShare}
        variant="outline"
        size="lg"
        className="bg-surface/95 backdrop-blur-sm hover:bg-surface border-border/20 shadow-floating w-12 h-12 rounded-full p-0"
      >
        <Share2 className="w-5 h-5" />
      </Button>

      {/* Settings */}
      <Button
        onClick={onSettings}
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
