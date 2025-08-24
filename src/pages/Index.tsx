import React, { useCallback } from 'react';
import MapView from '@/components/MapView';
import SearchBar from '@/components/SearchBar';
import FloatingControls from '@/components/FloatingControls';

const Index = () => {
  const handleSearch = useCallback((query: string) => {
    console.log('Searching for:', query);
    // TODO: Implementar chamada para Mapbox Geocoding API
    // Exemplo: fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?...`)
  }, []);

  // Callback chamado sempre que a localização do usuário mudar
  const handleLocationUpdate = useCallback((location: [number, number]) => {
    console.log('Nova localização:', location);
    // Aqui podemos atualizar estado global, analytics, etc.
  }, []);

  // Callback chamado quando uma rota for carregada/atualizada
  const handleRouteUpdate = useCallback((route: [number, number][]) => {
    console.log('Rota atualizada:', route.length, 'pontos');
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Mapa principal */}
      <MapView 
        onLocationUpdate={handleLocationUpdate} 
        onRouteUpdate={handleRouteUpdate}
      />
      
      {/* Barra de busca */}
      <div className="absolute top-4 left-4 right-20 z-20">
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Controles laterais */}
      <div className="absolute top-20 left-4 z-10">
        <FloatingControls />
      </div>
    </div>
  );
};

export default Index;
