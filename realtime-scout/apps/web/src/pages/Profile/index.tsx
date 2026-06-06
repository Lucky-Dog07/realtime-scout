import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { walletApi, userApi } from '../../services';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuthStore();
  const [balance, setBalance] = useState({ balance: 0, frozen_balance: 0 });
  const [editingNickname, setEditingNickname] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || user?.username || '');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadBalance(); refreshProfile(); }, []);

  const loadBalance = async () => {
    try {
      const res: any = await walletApi.getBalance();
      setBalance(res.data);
    } catch (err) { console.error(err); }
  };

  const refreshProfile = async () => {
    try {
      const res: any = await userApi.getProfile();
      setUser(res.data);
    } catch (err) { console.error(err); }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const res: any = await userApi.uploadAvatar(file);
      setUser(res.data);
    } catch (err: any) {
      alert(err.message || '上传失败');
    }
  };

  const handleNicknameSave = async () => {
    if (!nickname.trim()) {
      alert('昵称不能为空');
      return;
    }
    try {
      const res: any = await userApi.updateProfile({ nickname: nickname.trim() });
      setUser(res.data);
      setEditingNickname(false);
    } catch (err: any) {
      alert(err.message || '修改失败');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const level = Math.min(5, Math.floor((user?.total_completed || 0) / 5) + 1);
  const levelTitles = ['新手探路', '初级探路', '探路达人', '资深探路', '探路大师'];

  const menuItems = [
    { icon: '/wallet-icon.svg', label: '我的钱包', action: () => navigate('/profile/wallet') },
    { icon: '/review-icon.svg', label: '我的评价', action: () => navigate('/profile/reviews') },
    { icon: '/place-icon.svg', label: '常用地点', action: () => {} },
    { icon: '/camera-icon.svg', label: '拍摄规范', action: () => {} },
    { icon: '/help-icon.svg', label: '帮助中心', action: () => {} },
    { icon: '/settings-icon.svg', label: '设置', action: () => {} },
  ];

  return (
    <div className="profile-page">
      <div className="profile-header-card">
        <div className="profile-header-info">
          <div className="profile-avatar-wrapper" onClick={() => avatarInputRef.current?.click()}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar">{user?.nickname?.[0] || user?.username?.[0]}</div>
            )}
            <div className="avatar-edit-overlay">换头像</div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              hidden
            />
          </div>
          <div className="profile-header-text">
            {editingNickname ? (
              <div className="nickname-edit">
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleNicknameSave()}
                />
                <button onClick={handleNicknameSave}>保存</button>
                <button className="cancel" onClick={() => setEditingNickname(false)}>取消</button>
              </div>
            ) : (
              <h2 onClick={() => { setNickname(user?.nickname || user?.username || ''); setEditingNickname(true); }}>
                {user?.nickname || user?.username}
                <span className="edit-icon">✏️</span>
              </h2>
            )}
            <div className="profile-level">
              <span className="level-badge">Lv.{level}</span>
              <span className="level-title">{levelTitles[level - 1]}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-stats-row">
        <div className="stat-item clickable" onClick={() => navigate('/profile/wallet')}>
          <div className="stat-value orange">{Number(balance.balance).toFixed(2)}</div>
          <div className="stat-label">钱包余额（元）</div>
        </div>
        <div className="stat-item clickable" onClick={() => navigate('/my-tasks/accepted')}>
          <div className="stat-value">{user?.total_completed || 0}</div>
          <div className="stat-label">完成任务</div>
        </div>
        <div className="stat-item clickable" onClick={() => navigate('/profile/reviews')}>
          <div className="stat-value">{user?.rating || '5.0'}</div>
          <div className="stat-label">综合评分</div>
        </div>
      </div>

      <div className="profile-menu-card">
        <h3>我的功能</h3>
        <div className="profile-menu-list">
          {menuItems.map((item, i) => (
            <div key={i} className="profile-menu-item" onClick={item.action}>
              <span className="menu-icon"><img src={item.icon} alt="" className="menu-icon-img" /></span>
              <span className="menu-label">{item.label}</span>
              <span className="menu-arrow">›</span>
            </div>
          ))}
        </div>
      </div>

      <div className="profile-logout" onClick={handleLogout}>
        <span>🚪</span> 退出登录
      </div>
    </div>
  );
}
