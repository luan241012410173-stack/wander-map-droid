import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Geolocation, GeolocationPosition } from '@capacitor/geolocation';
import firebase from 'firebase/app';
import 'firebase/database';
import './App.css';

mapboxgl.accessToken = 'pk.eyJ1IjoibHVhbnphZGEiLCJhIjoiY21keHNqbzdsMTMzazJtcHJ5ZDBjcXIyNSJ9.wer3icvYBkquPNu_iRrnzA';

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  databaseURL: "https://SEU_PROJETO.firebaseio.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

const App = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    const database = firebase.database();

    if (mapContainer.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/luanzada/cmdz2rxnt015e01qp6eyi1nwp',
        zoom: 15,
      });

      mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      mapRef.current.on('load', () => {
        mapRef.current!.addSource('user-location', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] } },
        });
        mapRef.current!.addLayer({
          id: 'user-location',
          type: 'circle',
          source: 'user-location',
          paint: { 'circle-radius': 8, 'circle-color': '#007cbf' },
        });

        mapRef.current!.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
        });
        mapRef.current!.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#888', 'line-width': 8 },
        });
      });
    }

    const requestPermissions = async () => {
      try {
        const permission = await Geolocation.checkPermissions();
        if (permission.location !== 'granted') {
          await Geolocation.requestPermissions(['location']);
        }
      } catch (error) {
        console.error('Erro ao solicitar permissões:', error);
        alert('Por favor, conceda permissões de localização.');
      }
    };

    const setupLocation = async () => {
      await requestPermissions();
      try {
        const coordinates = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 30000,
        });
        const { latitude, longitude } = coordinates.coords;

        if (mapRef.current) {
          mapRef.current.setCenter([longitude, latitude]);
          markerRef.current = new mapboxgl.Marker()
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current);
          mapRef.current.getSource('user-location')?.setData({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [longitude, latitude] },
          });
        }

        const watchId = await Geolocation.watchPosition(
          { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 },
          (position: GeolocationPosition | null, err: any) => {
            if (err || !position) {
              console.error('Erro na localização:', err);
              alert('Não foi possível obter a localização. Verifique o GPS e a conexão.');
              return;
            }
            const { latitude, longitude } = position.coords;
            if (mapRef.current) {
              mapRef.current.setCenter([longitude, latitude]);
              markerRef.current?.setLngLat([longitude, latitude]);
              mapRef.current.getSource('user-location')?.setData({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [longitude, latitude] },
              });
            }

            database.ref('users/user_id').set({
              latitude,
              longitude,
              timestamp: Date.now(),
            });
          }
        );

        const getRoute = async (start: [number, number], end: [number, number]) => {
          try {
            const response = await fetch(
              `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`
            );
            const data = await response.json();
            if (data.routes && data.routes.length > 0) {
              mapRef.current?.getSource('route')?.setData(data.routes[0].geometry);
            }
          } catch (error) {
            console.error('Erro ao obter rota:', error);
          }
        };

        getRoute([longitude, latitude], [-46.6333, -23.5505]);

        return () => Geolocation.clearWatch({ id: watchId });
      } catch (error) {
        console.error('Erro ao obter localização inicial:', error);
        alert('Por favor, ative o GPS e conceda permissões de localização.');
      }
    };

    setupLocation();

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  return <div id="map" ref={mapContainer} style={{ width: '100%', height: '100vh' }} />;
};

export default App;
