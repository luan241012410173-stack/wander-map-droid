import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Geolocation } from '@capacitor/geolocation';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin, Crosshair, Play, Square, Route } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MapView = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const destinationMarker = useRef<mapboxgl.Marker | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeDistance, setRouteDistance] = useState<string>('');
  const [routeDuration, setRouteDuration] = useState<string>('');
  const navigationWatchId = useRef<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map with custom style
    mapboxgl.accessToken = 'pk.eyJ1IjoibHVhbnphZGEiLCJhIjoiY21keHNqbzdsMTMzazJtcHJ5ZDBjcXIyNSJ9.wer3icvYBkquPNu_iRrnzA';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/luanzada/cmdz2rxnt015e01qp6eyi1nwp',
      center: [-46.6333, -23.5505], // São Paulo default
      zoom: 12,
      pitch: 0,
      bearing: 0
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add scale control
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    // Disable scroll zoom on mobile for better UX
    map.current.scrollZoom.disable();
    map.current.addControl(new mapboxgl.NavigationControl());

    return () => {
      // Stop navigation watch if active
      if (navigationWatchId.current) {
        Geolocation.clearWatch({ id: navigationWatchId.current });
      }
      map.current?.remove();
    };
  }, []);

  const getCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      const { latitude, longitude } = coordinates.coords;
      setUserLocation([longitude, latitude]);

      if (map.current) {
        // Remove existing marker
        if (userMarker.current) {
          userMarker.current.remove();
        }

        // Create custom marker element
        const markerElement = document.createElement('div');
        markerElement.className = 'w-4 h-4 bg-navigation rounded-full border-2 border-white shadow-lg';

        // Add new marker
        userMarker.current = new mapboxgl.Marker(markerElement)
          .setLngLat([longitude, latitude])
          .addTo(map.current);

        // Fly to user location
        map.current.flyTo({
          center: [longitude, latitude],
          zoom: 16,
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setIsLocating(false);
    }
  };

  // Create route between user location and destination
  const createRoute = async (destination: [number, number]) => {
    if (!userLocation || !map.current) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation[0]},${userLocation[1]};${destination[0]},${destination[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`
      );
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // Set route info
        setRouteDistance((route.distance / 1000).toFixed(1) + ' km');
        setRouteDuration(Math.round(route.duration / 60) + ' min');
        
        // Add route layer to map
        if (map.current.getSource('route')) {
          map.current.removeLayer('route');
          map.current.removeSource('route');
        }
        
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: route.geometry
          }
        });
        
        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3B82F6',
            'line-width': 5,
            'line-opacity': 0.8
          }
        });

        toast({
          title: "Rota criada!",
          description: `${routeDistance} • ${routeDuration}`,
        });
      }
    } catch (error) {
      console.error('Error creating route:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a rota",
        variant: "destructive",
      });
    }
  };

  // Handle map click to set destination
  const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
    if (!userLocation) {
      toast({
        title: "Localização necessária",
        description: "Primeiro obtenha sua localização atual",
        variant: "destructive",
      });
      return;
    }

    const { lng, lat } = e.lngLat;
    setDestination([lng, lat]);

    // Remove existing destination marker
    if (destinationMarker.current) {
      destinationMarker.current.remove();
    }

    // Create destination marker
    const markerElement = document.createElement('div');
    markerElement.className = 'w-6 h-6 bg-destructive rounded-full border-2 border-white shadow-lg flex items-center justify-center';
    markerElement.innerHTML = '🎯';

    destinationMarker.current = new mapboxgl.Marker(markerElement)
      .setLngLat([lng, lat])
      .addTo(map.current!);

    // Create route
    createRoute([lng, lat]);
  };

  // Start navigation
  const startNavigation = async () => {
    if (!destination || !userLocation) return;

    setIsNavigating(true);
    
    // Start watching position
    try {
      navigationWatchId.current = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
        },
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation: [number, number] = [longitude, latitude];
          
          setUserLocation(newLocation);
          
          // Update user marker
          if (userMarker.current) {
            userMarker.current.setLngLat(newLocation);
          }
          
          // Center map on user location during navigation
          map.current?.easeTo({
            center: newLocation,
            duration: 1000
          });
        }
      );

      toast({
        title: "Navegação iniciada",
        description: "Siga as instruções da rota",
      });
    } catch (error) {
      console.error('Error starting navigation:', error);
      setIsNavigating(false);
    }
  };

  // Stop navigation
  const stopNavigation = async () => {
    setIsNavigating(false);
    
    if (navigationWatchId.current) {
      await Geolocation.clearWatch({ id: navigationWatchId.current });
      navigationWatchId.current = null;
    }

    // Clear route and destination
    if (map.current) {
      if (map.current.getSource('route')) {
        map.current.removeLayer('route');
        map.current.removeSource('route');
      }
    }

    if (destinationMarker.current) {
      destinationMarker.current.remove();
      destinationMarker.current = null;
    }

    setDestination(null);
    setRouteDistance('');
    setRouteDuration('');

    toast({
      title: "Navegação finalizada",
      description: "Rota removida",
    });
  };

  // Add map click handler
  useEffect(() => {
    if (!map.current) return;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      handleMapClick(e);
    };

    map.current.on('click', handleClick);

    return () => {
      map.current?.off('click', handleClick);
    };
  }, [userLocation]);

  return (
    <div className="relative w-full h-screen">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Floating Controls */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-surface/95 backdrop-blur-sm rounded-xl shadow-lg border border-border/20 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-navigation" />
              <span className="text-sm font-medium">GPS Navigator</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-location rounded-full animate-pulse"></div>
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Location Button */}
      <div className="absolute bottom-20 right-4 z-10">
        <Button
          variant="default"
          size="lg"
          onClick={getCurrentLocation}
          disabled={isLocating}
          className="bg-navigation hover:bg-navigation/90 text-white shadow-floating w-14 h-14 rounded-full p-0"
        >
          <Crosshair className={`w-6 h-6 ${isLocating ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Navigation Button */}
      <div className="absolute bottom-4 right-4 z-10">
        {destination && !isNavigating && (
          <Button
            variant="default"
            size="lg"
            onClick={startNavigation}
            className="bg-accent hover:bg-accent/90 text-white shadow-floating w-14 h-14 rounded-full p-0 mr-16"
          >
            <Play className="w-6 h-6" />
          </Button>
        )}
        {isNavigating && (
          <Button
            variant="destructive"
            size="lg"
            onClick={stopNavigation}
            className="shadow-floating w-14 h-14 rounded-full p-0"
          >
            <Square className="w-6 h-6" />
          </Button>
        )}
      </div>

      {/* Route Info Panel */}
      {destination && routeDistance && (
        <div className="absolute top-20 left-4 right-4 z-10">
          <div className="bg-surface/95 backdrop-blur-sm rounded-xl shadow-lg border border-border/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Route className="w-5 h-5 text-accent" />
                <div>
                  <div className="text-sm font-medium">{routeDistance}</div>
                  <div className="text-xs text-muted-foreground">{routeDuration}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isNavigating && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                    <span className="text-xs text-muted-foreground">Navegando</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions Panel */}
      {!userLocation && (
        <div className="absolute bottom-20 left-4 right-20 z-10">
          <div className="bg-surface/95 backdrop-blur-sm rounded-xl shadow-lg border border-border/20 p-4">
            <div className="text-sm">
              <div className="font-medium text-foreground mb-2">Como usar:</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>1. Clique no botão 🎯 para obter sua localização</div>
                <div>2. Toque no mapa para definir destino</div>
                <div>3. Clique em ▶️ para iniciar navegação</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Info Panel */}
      {userLocation && (
        <div className="absolute bottom-4 left-4 z-10 bg-surface/95 backdrop-blur-sm rounded-xl shadow-lg border border-border/20 p-4 max-w-xs">
          <div className="text-sm">
            <div className="font-medium text-foreground mb-1">Localização Atual</div>
            <div className="text-xs text-muted-foreground">
              Lat: {userLocation[1].toFixed(6)}
            </div>
            <div className="text-xs text-muted-foreground">
              Lng: {userLocation[0].toFixed(6)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;