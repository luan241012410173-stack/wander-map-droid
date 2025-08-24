import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { Geolocation } from '@capacitor/geolocation';
import firebase from 'firebase/app';
import 'firebase/database';

mapboxgl.accessToken = 'SUA_CHAVE_MAPBOX'; // Substitua pelo seu token

const App = () => {
  useEffect(() => {
    // Inicializar Firebase
    firebase.initializeApp({
      // Sua configuração do Firebase
    });
    const database = firebase.database();

    // Inicializar mapa
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/luanzada/cmdz2rxnt015e01qp6eyi1nwp',
      zoom: 15
    });

    // Solicitar permissões
    const requestPermissions = async () => {
      const permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted') {
        await Geolocation.requestPermissions(['location']);
      }
    };

    // Configurar localização
    const setupLocation = async () => {
      await requestPermissions();
      try {
        const coordinates = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 30000
        });
        const { latitude, longitude } = coordinates.coords;
        map.setCenter([longitude, latitude]);

        // Adicionar marcador
        new mapboxgl.Marker().setLngLat([longitude, latitude]).addTo(map);

        // Adicionar fonte e camada
        map.on('load', () => {
          map.addSource('user-location', {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'Point', coordinates: [longitude, latitude] } }
          });
          map.addLayer({
            id: 'user-location',
            type: 'circle',
            source: 'user-location',
            paint: { 'circle-radius': 8, 'circle-color': '#007cbf' }
          });
        });

        // Rastrear localização em tempo real
        const watchId = Geolocation.watchPosition(
          { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 },
          (position, err) => {
            if (err) {
              console.error('Erro na localização:', err);
              alert('Não foi possível obter a localização. Verifique o GPS.');
              return;
            }
            const { latitude, longitude } = position.coords;
            map.setCenter([longitude, latitude]);
            map.getSource('user-location')?.setData({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [longitude, latitude] }
            });

            // Enviar para Firebase
            database.ref('users/user_id').set({
              latitude,
              longitude,
              timestamp: Date.now()
            });
          }
        );

        return () => Geolocation.clearWatch({ id: watchId });
      } catch (error) {
        console.error('Erro ao obter localização inicial:', error);
        alert('Por favor, ative o GPS e conceda permissões de localização.');
      }
    };

    setupLocation();
  }, []);

  return <div id="map" style={{ width: '100%', height: '100vh' }} />;
};

export default App;
