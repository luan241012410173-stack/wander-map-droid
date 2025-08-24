import React from 'react';
import MapView from '@/components/MapView';
import SearchBar from '@/components/SearchBar';
import FloatingControls from '@/components/FloatingControls';

const Index = () => {
  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
    // Here you would implement Mapbox Geocoding API search
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Main Map View */}
      <MapView />
      
      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-20 z-20">
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Left Side Controls */}
      <div className="absolute top-20 left-4 z-10">
        <FloatingControls />
      </div>
    </div>
  );
};

export default Index;
