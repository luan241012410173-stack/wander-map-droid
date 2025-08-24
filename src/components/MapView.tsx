import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Geolocation } from '@capacitor/geolocation';
import { Button } from '@/components/ui/button';
import { Crosshair, Play, Square } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import * as turf from '@turf/turf';

const MapView = () => {
  const mapContainer = useRef(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const destinationMarker = useRef<mapboxgl.Marker | null>(null);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeDistance, setRouteDistance] = useState('');
  const [routeDuration, setRouteDuration] = useState('');

  const navigationWatchId = useRef<any>(null);
  const { toast } = useToast();

  const defaultCenter: [number, number] = [-55.9414, -15.2924]; // Campo Verde

  // --- PERMISSÕES ---
  const checkAndRequestPermissions = async () => {
    try {
      const permissionStatus = await Geolocation.checkPermissions();
      if (permissionStatus.location !== 'granted') {
        const requestStatus = await Geolocation.requestPermissions({
          permissions: ['location'],
        });
        if (requestStatus.location !== 'granted') {
          toast({
            title: 'Permissões necessárias',
            description: 'Ative a localização nas configurações.',
            variant: 'destructive',
          });
          return false;
        }
      }
      return true;
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível verificar permissões de localização.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // --- CALCULAR BEARING ---
  const calculateBearing = (from: [number, number], to: [number, number]) => {
    const y = Math.sin((to[0] - from[0]) * Math.PI / 180) * Math.cos(to[1] * Math.PI / 180);
    const x =
      Math.cos(from[1] * Math.PI / 180) * Math.sin(to[1] * Math.PI / 180) -
      Math.sin(from[1] * Math.PI / 180) *
        Math.cos(to[1] * Math.PI / 180) *
        Math.cos((to[0] - from[0]) * Math.PI / 180);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  };

  // --- PEGAR LOCALIZAÇÃO ATUAL ---
  const getCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const hasPermission = await checkAndRequestPermissions();
      if (!hasPermission) return;

      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
      setUserLocation(coords);

      if (map.current) {
        if (userMarker.current) userMarker.current.remove();

        const markerElement = document.createElement('div');
        markerElement.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"
            viewBox="0 0 24 24" fill="#2563eb" stroke="white" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(0deg);">
            <path d="M12 2 L19 21 L12 17 L5 21 Z" />
          </svg>
        `;
        markerElement.style.transformOrigin = 'center';

        userMarker.current = new mapboxgl.Marker({ element: markerElement })
          .setLngLat(coords)
          .addTo(map.current);

        map.current.flyTo({ center: coords, zoom: 16 });
      }
    } finally {
      setIsLocating(false);
    }
  };

  // --- INICIALIZAR MAPA ---
  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = 'SEU_TOKEN_MAPBOX_AQUI';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: defaultCenter,
      zoom: 12,
    });

    map.current.on('click', handleMapClick);

    return () => {
      if (navigationWatchId.current)
        Geolocation.clearWatch({ id: navigationWatchId.current });
      map.current?.remove();
    };
  }, []);

  // --- CRIAR ROTA ---
  const createRoute = async (dest: [number, number]) => {
    if (!userLocation) return;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation[0]},${userLocation[1]};${dest[0]},${dest[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
    const res = await fetch(url);
    const data = await res.json();
    const route = data.routes[0];

    setRouteCoords(route.geometry.coordinates);
    setRouteDistance((route.distance / 1000).toFixed(1) + ' km');
    setRouteDuration(Math.round(route.duration / 60) + ' min');

    if (map.current?.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }

    map.current?.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: route.geometry,
      },
    });

    map.current?.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      paint: { 'line-color': '#3B82F6', 'line-width': 5 },
    });
  };

  // --- CLIQUE NO MAPA PARA DEFINIR DESTINO ---
  const handleMapClick = (e: mapboxgl.MapMouseEvent & mapboxgl.EventData) => {
    if (!userLocation) return;
    const dest: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    setDestination(dest);

    if (destinationMarker.current) destinationMarker.current.remove();

    const markerEl = document.createElement('div');
    markerEl.innerHTML = '🎯';
    destinationMarker.current = new mapboxgl.Marker(markerEl)
      .setLngLat(dest)
      .addTo(map.current!);

    createRoute(dest);
  };

  // --- INICIAR NAVEGAÇÃO ---
  const startNavigation = async () => {
    if (!destination) return;
    setIsNavigating(true);

    navigationWatchId.current = await Geolocation.watchPosition(
      { enableHighAccuracy: true },
      (pos) => {
        if (!pos || !userLocation) return;
        const newLoc: [number, number] = [pos.coords.longitude, pos.coords.latitude];

        // Atualizar posição e rotação da seta
        if (userMarker.current) {
          userMarker.current.setLngLat(newLoc);
          const bearing = calculateBearing(userLocation, newLoc);
          const svg = userMarker.current.getElement().querySelector('svg');
          if (svg) svg.style.transform = `rotate(${bearing}deg)`;
        }
        setUserLocation(newLoc);

        // Atualizar rota apagando pontos já percorridos
        if (map.current?.getSource('route')) {
          const remaining = routeCoords.filter((coord) => {
            const dist = turf.distance(
              turf.point(coord),
              turf.point(newLoc),
              { units: 'meters' }
            );
            return dist > 20; // remove pontos a menos de 20m
          });

          setRouteCoords(remaining);

          (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: remaining },
          });

          // Atualizar distância restante
          const line = turf.lineString(remaining);
          const total = turf.length(line, { units: 'kilometers' });
          setRouteDistance(total.toFixed(2) + ' km');
        }

        map.current?.easeTo({ center: newLoc, duration: 1000 });
      }
    );
  };

  // --- PARAR NAVEGAÇÃO ---
  const stopNavigation = async () => {
    setIsNavigating(false);
    if (navigationWatchId.current) {
      await Geolocation.clearWatch({ id: navigationWatchId.current });
      navigationWatchId.current = null;
    }
    if (map.current?.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }
    setDestination(null);
    setRouteCoords([]);
    setRouteDistance('');
    setRouteDuration('');
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Painel inferior com status */}
      {(routeDistance || routeDuration) && (
        <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-4 text-center shadow-md">
          <p className="text-lg font-medium">Distância: {routeDistance}</p>
          <p className="text-sm text-gray-700">Tempo estimado: {routeDuration}</p>
        </div>
      )}

      {/* Botões principais */}
      <div className="absolute bottom-28 right-4 flex flex-col gap-3 z-10">
        <Button onClick={getCurrentLocation} disabled={isLocating}>
          <Crosshair className="w-6 h-6" />
        </Button>
        {destination && !isNavigating && (
          <Button onClick={startNavigation}>
            <Play className="w-6 h-6" />
          </Button>
        )}
        {isNavigating && (
          <Button variant="destructive" onClick={stopNavigation}>
            <Square className="w-6 h-6" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default MapView;
