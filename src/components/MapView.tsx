import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Geolocation } from '@capacitor/geolocation';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin, Crosshair } from 'lucide-react';

const MapView = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);

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
        <Button
          variant="default"
          size="lg"
          className="bg-accent hover:bg-accent/90 text-white shadow-floating w-14 h-14 rounded-full p-0"
        >
          <Navigation className="w-6 h-6" />
        </Button>
      </div>

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