export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({
          latitude: parseFloat(latitude.toFixed(6)),
          longitude: parseFloat(longitude.toFixed(6)),
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        let message = 'Unable to retrieve location';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Location permission denied. Please enable location access.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Location information is unavailable.';
        } else if (error.code === error.TIMEOUT) {
          message = 'Location request timed out.';
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

export const formatLocationCoordinates = (latitude, longitude) => {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};

export const getLocationMapUrl = (latitude, longitude) => {
  return `https://www.google.com/maps/search/${latitude},${longitude}`;
};

export const parseLocationCoordinates = (value) => {
  if (!value || typeof value !== 'string') return null;

  const parts = value.split(',').map((part) => part.trim());
  if (parts.length !== 2) return null;

  const latitude = Number.parseFloat(parts[0]);
  const longitude = Number.parseFloat(parts[1]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return { latitude, longitude };
};

export const getLocationEmbedUrl = (latitude, longitude) => {
  return `https://maps.google.com/maps?q=${latitude},${longitude}&z=17&t=k&output=embed`;
};
