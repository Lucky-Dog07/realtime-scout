import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import { AppOutline, UnorderedListOutline, AddCircleOutline, FileOutline, UserOutline } from 'antd-mobile-icons';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { key: '/', title: '首页', icon: <AppOutline /> },
    { key: '/browse', title: '接单', icon: <UnorderedListOutline /> },
    { key: '/publish', title: '发布', icon: <AddCircleOutline /> },
    { key: '/my-tasks', title: '我的', icon: <FileOutline /> },
    { key: '/profile', title: '个人', icon: <UserOutline /> },
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </div>
      <TabBar
        activeKey={location.pathname}
        onChange={(key) => navigate(key)}
        style={{ borderTop: '1px solid #eee', background: '#fff' }}
      >
        {tabs.map((tab) => (
          <TabBar.Item key={tab.key} icon={tab.icon} title={tab.title} />
        ))}
      </TabBar>
    </div>
  );
}
