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

// Custom user marker icon
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

  if (!userGeolocation?.latitude || !userGeolocation?.longitude) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg bg-gray-100">
        <p className="text-gray-500">{t('admin.orders.noLocation')}</p>
      </div>
    );
  }

  const position = {
    lat: userGeolocation.latitude,
    lng: userGeolocation.longitude
  };

  return (
    <div className="h-[300px] w-full rounded-lg overflow-hidden">
      <MapContainer
        center={[position.lat, position.lng]}
        zoom={15}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={userIcon}>
          <Popup>
            <div className="text-center">
              <p className="font-medium">{userName}</p>
              <p className="text-sm text-gray-600">
                {t('checkout.location.coordinates.latitude')}: {position.lat.toFixed(6)}
              </p>
              <p className="text-sm text-gray-600">
                {t('checkout.location.coordinates.longitude')}: {position.lng.toFixed(6)}
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default OrderLocationMap; 