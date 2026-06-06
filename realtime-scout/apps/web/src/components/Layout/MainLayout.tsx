import { useState, useEffect, createContext, useContext } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { notificationApi } from '../../services';
import './MainLayout.css';

declare const AMap: any;

interface SearchContextType {
  searchLocation: { lng: number; lat: number; name: string } | null;
  setSearchLocation: (loc: { lng: number; lat: number; name: string } | null) => void;
}

export const SearchContext = createContext<SearchContextType>({
  searchLocation: null,
  setSearchLocation: () => {},
});

export function useSearchContext() {
  return useContext(SearchContext);
}

const navItems = [
  { key: '/', icon: '/home-icon.svg', label: '首页' },
  { key: '/publish', icon: '/add-icon.svg', label: '发布任务' },
];

const taskSubItems = [
  { key: '/my-tasks', label: '我发布的' },
  { key: '/my-tasks/accepted', label: '我接单的' },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [searchText, setSearchText] = useState('');
  const [searchLocation, setSearchLocation] = useState<{ lng: number; lat: number; name: string } | null>(null);
  const [taskMenuOpen, setTaskMenuOpen] = useState(
    location.pathname.startsWith('/my-tasks')
  );
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnread();
    const timer = setInterval(loadUnread, 15000);
    const handleRead = () => loadUnread();
    window.addEventListener('notifications-read', handleRead);
    return () => {
      clearInterval(timer);
      window.removeEventListener('notifications-read', handleRead);
    };
  }, []);

  const loadUnread = async () => {
    try {
      const res: any = await notificationApi.getUnreadCount();
      setUnreadCount(res.data?.count || 0);
    } catch {}
  };

  const handleSearch = () => {
    if (!searchText.trim()) return;
    const geocoder = new AMap.Geocoder();
    geocoder.getLocation(searchText, (status: string, result: any) => {
      if (status === 'complete' && result.geocodes.length > 0) {
        const geo = result.geocodes[0];
        setSearchLocation({
          lng: geo.location.lng,
          lat: geo.location.lat,
          name: geo.formattedAddress,
        });
        if (location.pathname !== '/') {
          navigate('/');
        }
      } else {
        alert('未找到该地点');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <SearchContext.Provider value={{ searchLocation, setSearchLocation }}>
      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-logo" onClick={() => navigate('/')}>
            <div className="logo-icon"><img src="/location-icon.svg" alt="" /></div>
            <div className="logo-text">
              <h1>实时探路</h1>
              <p>看现场、出行更放心</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <div
                key={item.key}
                className={`nav-item ${location.pathname === item.key ? 'active' : ''}`}
                onClick={() => navigate(item.key)}
              >
                <span className="nav-icon">
                  {item.icon.endsWith('.svg')
                    ? <img src={item.icon} alt="" className="nav-icon-img" />
                    : item.icon}
                </span>
                <span className="nav-label">{item.label}</span>
              </div>
            ))}

            <div className="nav-group">
              <div
                className={`nav-item nav-group-title ${location.pathname.startsWith('/my-tasks') ? 'active' : ''}`}
                onClick={() => setTaskMenuOpen(!taskMenuOpen)}
              >
                <span className="nav-icon"><img src="/tasks-icon.svg" alt="" className="nav-icon-img" /></span>
                <span className="nav-label">我的任务</span>
                <span className={`nav-arrow ${taskMenuOpen ? 'open' : ''}`}>›</span>
              </div>
              {taskMenuOpen && taskSubItems.map((item) => (
                <div
                  key={item.key}
                  className={`nav-item nav-sub ${location.pathname === item.key ? 'active' : ''}`}
                  onClick={() => navigate(item.key)}
                >
                  <span className="nav-label">{item.label}</span>
                </div>
              ))}
            </div>

            <div
              className={`nav-item ${location.pathname === '/messages' ? 'active' : ''}`}
              onClick={() => navigate('/messages')}
            >
              <span className="nav-icon"><img src="/chat-icon.svg" alt="" className="nav-icon-img" /></span>
              <span className="nav-label">消息</span>
              {unreadCount > 0 && <span className="nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </div>

            <div
              className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
              onClick={() => navigate('/profile')}
            >
              <span className="nav-icon"><img src="/profile-icon.svg" alt="" className="nav-icon-img" /></span>
              <span className="nav-label">个人中心</span>
            </div>
          </nav>

          <div className="sidebar-banner">
            <div className="banner-top">
              <div className="banner-text">
                <p>利用碎片时间</p>
                <p>轻松赚取报酬</p>
              </div>
              <img src="/map-location.svg" alt="" className="banner-illust" />
            </div>
            <button className="banner-btn" onClick={() => navigate('/browse')}>立即接单</button>
          </div>
        </aside>

        <div className="main">
          <header className="header">
            <div className="header-left">
              <span className="city-selector"><img src="/location-icon.svg" alt="" className="city-icon" /> 定位中</span>
              {location.pathname !== '/publish' && (
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="搜索地点、商圈、景点等"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button className="search-btn" onClick={handleSearch}>搜索</button>
                </div>
              )}
            </div>
            <div className="header-right">
              <span className="header-msg" onClick={() => navigate('/messages')}>
                <img src="/chat-icon.svg" alt="" className="header-msg-icon" /> 消息
                {unreadCount > 0 && <span className="header-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </span>
              <div className="header-user" onClick={() => navigate('/profile')}>
                <div className="avatar">{user?.nickname?.[0] || user?.username?.[0] || '?'}</div>
                <span>{user?.nickname || user?.username}</span>
              </div>
            </div>
          </header>

          <div className="content">
            <Outlet />
          </div>
        </div>
      </div>
    </SearchContext.Provider>
  );
}
