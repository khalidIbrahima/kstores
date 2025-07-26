import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationMarker = ({ position, setPosition }) => {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);

  return position ? (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const newPosition = e.target.getLatLng();
          setPosition(newPosition);
        },
        click: (e) => {
          // Optionnel: centrer la carte sur le marqueur quand on clique dessus
          map.setView(e.target.getLatLng(), map.getZoom());
        },
      }}
    />
  ) : null;
};

const LocationPicker = ({ onLocationSelect, initialPosition = null }) => {
  const { t } = useTranslation();
  const [position, setPosition] = useState(initialPosition);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!initialPosition) {
      setIsLoading(true);
      // Get user's current location
      navigator.geolocation.getCurrentPosition(
        (location) => {
          const newPosition = {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          };
          setPosition(newPosition);
          onLocationSelect(newPosition);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError(t('checkout.location.error'));
          // Default to Dakar if location access is denied
          const defaultPosition = { lat: 14.7167, lng: -17.4677 };
          setPosition(defaultPosition);
          onLocationSelect(defaultPosition);
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      setIsLoading(false);
    }
  }, [initialPosition, onLocationSelect, t]);

  const handleMapClick = (e) => {
    const newPosition = e.latlng;
    setPosition(newPosition);
    onLocationSelect(newPosition);
  };

  const handleUseCurrentLocation = () => {
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (location) => {
        const newPosition = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
        setPosition(newPosition);
        onLocationSelect(newPosition);
        setError(null);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setError(t('checkout.location.error'));
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="relative h-full w-full">
      {/* Instructions */}
      <div className="absolute top-4 left-4 z-10 rounded-md bg-white p-3 shadow-md">
        <p className="text-sm text-gray-700 mb-2">
          {t('checkout.location.instructions')}
        </p>
        <button
          onClick={handleUseCurrentLocation}
          disabled={isLoading}
          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : t('checkout.location.currentLocation')}
        </button>
      </div>

      <MapContainer
        center={position || [14.7167, -17.4677]}
        zoom={13}
        className="h-full w-full"
        onClick={handleMapClick}
        style={{ cursor: 'crosshair' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} />
      </MapContainer>
      
      {error && (
        <div className="absolute bottom-4 left-4 rounded-md bg-red-100 border border-red-400 p-2 text-sm text-red-700">
          {error}
        </div>
      )}
      
      <div className="absolute bottom-4 right-4 rounded-md bg-white p-2 text-sm text-gray-700 shadow-md">
        {position && (
          <>
            <div className="font-medium mb-1">Selected Location:</div>
            <div>{t('checkout.location.coordinates.latitude')}: {position.lat.toFixed(6)}</div>
            <div>{t('checkout.location.coordinates.longitude')}: {position.lng.toFixed(6)}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default LocationPicker; 