import { useState, useEffect } from 'react';

declare const AMap: any;

interface LocationState {
  lng: number;
  lat: number;
  loading: boolean;
  error: string | null;
  accuracy: number | null;
  source: string;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    lng: 116.397428,
    lat: 39.90923,
    loading: true,
    error: null,
    accuracy: null,
    source: 'default',
  });

  useEffect(() => {
    let resolved = false;

    // 方案1: 浏览器原生GPS（HTTPS下最准确）
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (resolved) return;
          resolved = true;
          setLocation({
            lng: pos.coords.longitude,
            lat: pos.coords.latitude,
            loading: false,
            error: null,
            accuracy: pos.coords.accuracy,
            source: 'browser-gps',
          });
        },
        (err) => {
          console.warn('浏览器定位失败:', err.message);
          // 浏览器失败后尝试高德
          if (!resolved) {
            tryAMapGeolocation();
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      tryAMapGeolocation();
    }

    // 方案2: 高德SDK定位（IP+WiFi）
    function tryAMapGeolocation() {
      try {
        const geolocation = new AMap.Geolocation({
          enableHighAccuracy: true,
          timeout: 10000,
          convert: true,
        });

        geolocation.getCurrentPosition((status: string, result: any) => {
          if (resolved) return;
          resolved = true;
          if (status === 'complete') {
            setLocation({
              lng: result.position.lng,
              lat: result.position.lat,
              loading: false,
              error: null,
              accuracy: result.accuracy,
              source: 'amap-sdk',
            });
          } else {
            // 方案3: 高德IP定位（精度最低但一定能返回城市级别）
            tryIPLocation();
          }
        });
      } catch {
        tryIPLocation();
      }
    }

    // 方案3: 高德CitySearch（基于IP获取城市中心点）
    function tryIPLocation() {
      try {
        AMap.plugin('AMap.CitySearch', () => {
          const citySearch = new AMap.CitySearch();
          citySearch.getLocalCity((status: string, result: any) => {
            if (resolved) return;
            resolved = true;
            if (status === 'complete' && result.bounds) {
              const center = result.bounds.getCenter();
              setLocation({
                lng: center.lng,
                lat: center.lat,
                loading: false,
                error: null,
                accuracy: null,
                source: 'ip-city',
              });
            } else {
              setLocation((prev) => ({ ...prev, loading: false, error: '所有定位方式均失败' }));
            }
          });
        });
      } catch {
        if (!resolved) {
          resolved = true;
          setLocation((prev) => ({ ...prev, loading: false, error: '定位失败' }));
        }
      }
    }

    // 超时兜底：15秒后如果还没结果就停止loading
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setLocation((prev) => ({ ...prev, loading: false, error: '定位超时' }));
      }
    }, 15000);

    return () => { clearTimeout(timer); };
  }, []);

  return location;
}
