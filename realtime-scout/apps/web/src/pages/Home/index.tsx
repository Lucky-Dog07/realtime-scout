import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchContext } from '../../components/Layout/MainLayout';
import { useAuthStore } from '../../store/authStore';
import { taskApi } from '../../services';
import type { Task } from '@realtime-scout/shared';
import './Home.css';

declare const AMap: any;

export default function Home() {
  const navigate = useNavigate();
  const { searchLocation } = useSearchContext();
  const user = useAuthStore((s) => s.user);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyAcceptable, setOnlyAcceptable] = useState(false);
  const [locInfo, setLocInfo] = useState({ text: '定位中...', source: '' });
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const centerRef = useRef({ lng: 116.397, lat: 39.909 });

  // 初始化地图（不等定位）
  useEffect(() => {
    if (!mapRef.current) return;

    const map = new AMap.Map(mapRef.current, {
      zoom: 14,
      center: [centerRef.current.lng, centerRef.current.lat],
    });
    mapInstance.current = map;

    // 启动定位
    doLocate(map);

    return () => { map.destroy(); };
  }, []);

  // 响应搜索
  useEffect(() => {
    if (!searchLocation || !mapInstance.current) return;
    centerRef.current = { lng: searchLocation.lng, lat: searchLocation.lat };
    setLocInfo({ text: searchLocation.name, source: 'search' });
    loadTasks(searchLocation.lng, searchLocation.lat, 50000, true);
  }, [searchLocation]);

  const doLocate = (map: any) => {
    AMap.plugin('AMap.Geolocation', () => {
      const geolocation = new AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 10000,
        buttonPosition: 'RB',
        showButton: true,
        showCircle: true,
        showMarker: true,
        panToLocation: true,
        zoomToAccuracy: true,
      });
      map.addControl(geolocation);

      geolocation.getCurrentPosition((status: string, result: any) => {
        if (status === 'complete') {
          centerRef.current = { lng: result.position.lng, lat: result.position.lat };
          setLocInfo({
            text: result.formattedAddress || `${result.position.lng.toFixed(4)}, ${result.position.lat.toFixed(4)}`,
            source: `精度: ${Math.round(result.accuracy)}米`,
          });
          loadTasks(result.position.lng, result.position.lat);
        } else {
          // fallback: IP定位
          AMap.plugin('AMap.CitySearch', () => {
            const citySearch = new AMap.CitySearch();
            citySearch.getLocalCity((cs: string, cr: any) => {
              if (cs === 'complete' && cr.bounds) {
                const center = cr.bounds.getCenter();
                centerRef.current = { lng: center.lng, lat: center.lat };
                map.setCenter([center.lng, center.lat]);
                map.setZoom(12);
                setLocInfo({ text: `${cr.city}（IP定位）`, source: '精确定位失败，已使用IP定位' });
                loadTasks(center.lng, center.lat);
              } else {
                setLocInfo({ text: '定位失败，请搜索或右键地图设置位置', source: '' });
                loadTasks(centerRef.current.lng, centerRef.current.lat);
              }
            });
          });
        }
      });
    });

    // 右键点击地图设置当前位置
    map.on('rightclick', (e: any) => {
      const clickLng = e.lnglat.getLng();
      const clickLat = e.lnglat.getLat();
      centerRef.current = { lng: clickLng, lat: clickLat };
      map.setCenter([clickLng, clickLat]);

      const geocoder = new AMap.Geocoder();
      geocoder.getAddress([clickLng, clickLat], (s: string, r: any) => {
        const name = s === 'complete' ? r.regeocode.formattedAddress : `${clickLng.toFixed(4)}, ${clickLat.toFixed(4)}`;
        setLocInfo({ text: name, source: '手动设置' });
      });
      loadTasks(clickLng, clickLat);
    });
  };
  const loadTasks = async (centerLng: number, centerLat: number, radius?: number, fitBounds?: boolean) => {
    try {
      const res: any = await taskApi.getNearby(centerLng, centerLat, radius || 10000);
      const taskList = res.data || [];
      setTasks(taskList);

      // 添加任务标记
      if (mapInstance.current) {
        // 清除旧的任务标记（保留定位标记）
        mapInstance.current.getAllOverlays('marker').forEach((m: any) => {
          if (m._isTask) mapInstance.current.remove(m);
        });

        const markers: any[] = [];
        taskList.forEach((task: Task) => {
          const marker = new AMap.Marker({
            position: [task.lng, task.lat],
            map: mapInstance.current,
            content: `<div class="task-marker">
              <div class="marker-price">¥${task.reward}</div>
              <div class="marker-info">待接单</div>
            </div>`,
            anchor: 'bottom-center',
          });
          (marker as any)._isTask = true;
          marker.on('click', () => navigate(`/task/${task.id}`));
          markers.push(marker);
        });

        // 搜索模式下自动调整视野，包含搜索中心和所有任务
        if (fitBounds && taskList.length > 0) {
          const bounds = new AMap.Bounds(
            [centerLng, centerLat],
            [centerLng, centerLat]
          );
          taskList.forEach((task: Task) => {
            bounds.extend(new AMap.LngLat(task.lng, task.lat));
          });
          mapInstance.current.setBounds(bounds, false, [60, 60, 60, 60]);
        } else if (fitBounds) {
          mapInstance.current.setCenter([centerLng, centerLat]);
          mapInstance.current.setZoom(15);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = onlyAcceptable
    ? tasks.filter((t) => t.publisher_id !== user?.id)
    : tasks;

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
  };

  return (
    <div className="home">
      <div className="home-map-area">
        <div className="map-toolbar">
          <label className="toolbar-item">
            <input type="checkbox" checked={onlyAcceptable} onChange={(e) => setOnlyAcceptable(e.target.checked)} /> 只看可接任务
          </label>
          <button className="toolbar-btn" onClick={() => loadTasks(centerRef.current.lng, centerRef.current.lat)}>🔄 刷新</button>
        </div>
        <div ref={mapRef} className="map-container" />
        <div className="map-footer">
          <span>当前位置：{locInfo.text}</span>
          <span>{locInfo.source}</span>
        </div>
      </div>

      <div className="home-task-panel">
        <div className="panel-header">
          <h3>附近任务</h3>
          <select className="sort-select">
            <option>综合排序</option>
            <option>距离最近</option>
            <option>金额最高</option>
            <option>最新发布</option>
          </select>
        </div>

        <div className="task-list">
          {loading ? (
            <div className="loading-state">加载中...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="empty-state">
              <p>暂无附近任务</p>
              <p className="hint">附近还没有人发布任务</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task.id} className="task-card" onClick={() => navigate(`/task/${task.id}`)}>
                <div className="task-card-header">
                  <h4 className="task-title">{task.title}</h4>
                  <span className="task-reward">¥{task.reward}</span>
                </div>
                <p className="task-desc">{task.description}</p>
                <div className="task-meta">
                  <span className="meta-location">📍 {task.location_name}</span>
                  <span className="meta-time">🕐 {getTimeAgo(task.created_at)}</span>
                  <span className="meta-status">待接单</span>
                </div>
              </div>
            ))
          )}
        </div>

        {tasks.length > 0 && (
          <div className="panel-footer">
            <a onClick={() => navigate('/browse')}>查看全部任务</a>
          </div>
        )}
      </div>
    </div>
  );
}
