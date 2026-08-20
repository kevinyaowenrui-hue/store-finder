/**
 * Geolocation and Distance utility functions
 */

export interface GeoLocation {
  lat: number;
  lng: number;
}

/**
 * Format distance in kilometers to user-friendly text
 */
export function formatDistance(distanceKm?: number | null): string {
  if (distanceKm === undefined || distanceKm === null || isNaN(distanceKm)) {
    return '';
  }

  if (distanceKm < 0.1) {
    return '< 100m';
  }
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  }
  return `${Math.round(distanceKm)}km`;
}

/**
 * Prompt user for browser geolocation
 */
export async function requestUserLocation(): Promise<GeoLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('当前浏览器不支持地理定位'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        let msg = '无法获取当前位置';
        if (err.code === err.PERMISSION_DENIED) {
          msg = '您已拒绝位置授权，请在浏览器地址栏允许定位';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = '位置信息不可用';
        } else if (err.code === err.TIMEOUT) {
          msg = '获取位置超时';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  });
}
