import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskApi } from '../../services';
import { MIN_REWARD } from '@realtime-scout/shared';
import './PublishTask.css';

declare const AMap: any;

export default function PublishTask() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ lng: number; lat: number; name: string } | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    reward: '',
    deadline_minutes: 60,
    photo_count: 1,
  });
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = new AMap.Map(mapRef.current, {
      zoom: 12,
      center: [121.4737, 31.2304],
    });
    mapInstance.current = map;

    // 点击地图选点
    map.on('click', (e: any) => {
      placeMarker(e.lnglat.getLng(), e.lnglat.getLat());
    });

    return () => { map.destroy(); };
  }, []);

  const placeMarker = (lng: number, lat: number) => {
    if (markerRef.current) {
      markerRef.current.setPosition([lng, lat]);
    } else {
      markerRef.current = new AMap.Marker({
        position: [lng, lat],
        map: mapInstance.current,
        draggable: true,
      });
      markerRef.current.on('dragend', (e: any) => {
        const pos = markerRef.current.getPosition();
        reverseGeocode(pos.lng, pos.lat);
      });
    }
    reverseGeocode(lng, lat);
  };

  const reverseGeocode = (lng: number, lat: number) => {
    const geocoder = new AMap.Geocoder();
    geocoder.getAddress([lng, lat], (status: string, result: any) => {
      const name = status === 'complete' ? result.regeocode.formattedAddress : `${lng.toFixed(6)}, ${lat.toFixed(6)}`;
      setSelectedLocation({ lng, lat, name });
    });
  };

  const handleSearch = () => {
    if (!searchText.trim()) return;
    AMap.plugin('AMap.PlaceSearch', () => {
      const placeSearch = new AMap.PlaceSearch({
        map: mapInstance.current,
        pageSize: 10,
      });
      placeSearch.search(searchText, (status: string, result: any) => {
        if (status === 'complete' && result.poiList?.pois?.length > 0) {
          const poi = result.poiList.pois[0];
          const lng = poi.location.lng;
          const lat = poi.location.lat;
          mapInstance.current.setCenter([lng, lat]);
          mapInstance.current.setZoom(15);
          placeMarker(lng, lat);
        } else {
          // 尝试地理编码
          const geocoder = new AMap.Geocoder();
          geocoder.getLocation(searchText, (s: string, r: any) => {
            if (s === 'complete' && r.geocodes?.length > 0) {
              const geo = r.geocodes[0];
              mapInstance.current.setCenter([geo.location.lng, geo.location.lat]);
              mapInstance.current.setZoom(15);
              placeMarker(geo.location.lng, geo.location.lat);
            } else {
              alert('未找到该地点，请尝试更具体的名称');
            }
          });
        }
      });
    });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) {
      alert('请在地图上选择目标地点（点击地图或搜索地点）');
      return;
    }
    if (!form.title || !form.description || !form.reward) {
      alert('请填写完整信息');
      return;
    }
    if (parseFloat(form.reward) < MIN_REWARD) {
      alert(`悬赏金额不能低于${MIN_REWARD}元`);
      return;
    }

    setLoading(true);
    try {
      await taskApi.create({
        title: form.title,
        description: form.description,
        lng: selectedLocation.lng,
        lat: selectedLocation.lat,
        location_name: selectedLocation.name,
        reward: parseFloat(form.reward),
        photo_count: form.photo_count,
        deadline_minutes: form.deadline_minutes,
      });
      alert('发布成功！');
      navigate('/');
    } catch (err: any) {
      alert(err.message || '发布失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="publish-page">
      <div className="publish-left">
        <h2>选择目标地点</h2>
        <div className="publish-search">
          <input
            type="text"
            placeholder="搜索地点，如：上海迪士尼"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <button onClick={handleSearch}>搜索</button>
        </div>
        <p className="publish-hint">搜索地点或直接点击地图选择位置，可拖动标记微调</p>
        <div ref={mapRef} className="publish-map" />
        {selectedLocation && (
          <div className="selected-location">
            📍 已选择：{selectedLocation.name}
          </div>
        )}
      </div>
      <div className="publish-right">
        <h2>发布任务</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>任务标题</label>
            <input
              type="text"
              placeholder="如：帮看迪士尼排队情况"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label>详细描述</label>
            <textarea
              rows={4}
              placeholder="详细描述你想了解的内容，如：想知道飞越地平线排队大概多久"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>悬赏金额（元）</label>
              <input
                type="number"
                min={0.01}
                step="0.01"
                placeholder="输入金额"
                value={form.reward}
                onChange={(e) => setForm({ ...form, reward: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>需要照片数</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[1-9]"
                value={form.photo_count}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!e.target.value) setForm({ ...form, photo_count: 1 });
                  else if (val >= 1 && val <= 9) setForm({ ...form, photo_count: val });
                }}
              />
            </div>
          </div>
          <div className="form-field">
            <label>任务有效期</label>
            <select
              value={form.deadline_minutes}
              onChange={(e) => setForm({ ...form, deadline_minutes: parseInt(e.target.value) })}
            >
              <option value={30}>30分钟</option>
              <option value={60}>1小时</option>
              <option value={120}>2小时</option>
              <option value={240}>4小时</option>
              <option value={720}>12小时</option>
              <option value={1440}>24小时</option>
            </select>
          </div>
          <div className="form-field">
            <label>拍摄要求（选填）</label>
            <input type="text" placeholder="如：拍门口排队情况、拍菜单价格" />
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '发布中...' : '发布任务'}
          </button>
        </form>
      </div>
    </div>
  );
}
