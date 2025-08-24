import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClose?: () => void;
  className?: string;
}

const SearchBar = ({ onSearch, onClose, className }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    setIsExpanded(false);
    onClose?.();
  };

  return (
    <div className={cn("relative", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar endereço, local..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsExpanded(true);
            }}
            className="pl-10 pr-20 bg-surface/95 backdrop-blur-sm border-border/20 focus:border-navigation/50 focus:ring-navigation/20 shadow-floating"
            onFocus={() => setIsExpanded(true)}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 w-8 p-0 hover:bg-muted/50"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              className="bg-navigation hover:bg-navigation/90 text-white h-8 px-3"
            >
              Ir
            </Button>
          </div>
        </div>
      </form>

      {/* Search Suggestions/Results */}
      {isExpanded && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border/20 rounded-lg shadow-elevated max-h-60 overflow-y-auto z-50">
          <div className="p-2 space-y-1">
            {/* Mock suggestions - in real app this would come from Mapbox Geocoding API */}
            <div className="p-3 hover:bg-muted/50 cursor-pointer rounded-md transition-colors">
              <div className="font-medium text-sm">Centro, São Paulo - SP</div>
              <div className="text-xs text-muted-foreground">São Paulo, Brasil</div>
            </div>
            <div className="p-3 hover:bg-muted/50 cursor-pointer rounded-md transition-colors">
              <div className="font-medium text-sm">Avenida Paulista</div>
              <div className="text-xs text-muted-foreground">Bela Vista, São Paulo - SP</div>
            </div>
            <div className="p-3 hover:bg-muted/50 cursor-pointer rounded-md transition-colors">
              <div className="font-medium text-sm">Shopping Ibirapuera</div>
              <div className="text-xs text-muted-foreground">Moema, São Paulo - SP</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;