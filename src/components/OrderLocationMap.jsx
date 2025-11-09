import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom user marker icon with primary color
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const OrderLocationMap = ({ userGeolocation, userName }) => {
  const { t } = useTranslation();
  const [mapError, setMapError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    // Simuler un délai de chargement pour la carte
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Augmenté à 1.5 secondes

    return () => clearTimeout(timer);
  }, []);

  // État de chargement
  if (isLoading) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  // Gestion d'erreur de la carte
  if (mapError) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg bg-gray-100">
        <div className="text-center">
          <p className="text-gray-500 mb-2">🗺️</p>
          <p className="text-gray-600">Erreur de chargement de la carte</p>
          <p className="text-sm text-gray-400">Impossible d'afficher la localisation</p>
        </div>
      </div>
    );
  }

  // Parse userGeolocation (handles both string JSON and object)
  let parsedUserGeolocation = userGeolocation;
  if (typeof userGeolocation === 'string') {
    try {
      parsedUserGeolocation = JSON.parse(userGeolocation);
    } catch (e) {
      console.error('Error parsing userGeolocation:', e);
      parsedUserGeolocation = null;
    }
  }

  // Extract coordinates (handles both lat/lng and latitude/longitude formats)
  let lat = null;
  let lng = null;
  
  if (parsedUserGeolocation) {
    // Try latitude/longitude first
    if (parsedUserGeolocation.latitude != null && parsedUserGeolocation.longitude != null) {
      lat = parsedUserGeolocation.latitude;
      lng = parsedUserGeolocation.longitude;
    }
    // Fall back to lat/lng
    else if (parsedUserGeolocation.lat != null && parsedUserGeolocation.lng != null) {
      lat = parsedUserGeolocation.lat;
      lng = parsedUserGeolocation.lng;
    }
  }

  // Vérifier si les coordonnées sont valides
  if (!lat || !lng) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg bg-gray-100">
        <div className="text-center">
          <p className="text-gray-500 mb-2">📍</p>
          <p className="text-gray-600">Aucune localisation disponible</p>
          <p className="text-sm text-gray-400">Le client n'a pas partagé sa position</p>
        </div>
      </div>
    );
  }


  return (
    <div className="h-[300px] w-full rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        className="h-full w-full"
        style={{ minHeight: '300px' }}
        onError={() => setMapError(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={userIcon}>
          <Popup>
            <div className="text-center">
              <p className="font-medium text-gray-900">{userName || 'Client'}</p>
              <p className="text-sm text-gray-600">
                Latitude: {lat.toFixed(6)}
              </p>
              <p className="text-sm text-gray-600">
                Longitude: {lng.toFixed(6)}
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default OrderLocationMap; 