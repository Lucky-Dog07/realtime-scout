import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { walletApi } from '../../services';
import './Wallet.css';

export default function Wallet() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState({ balance: 0, frozen_balance: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupStep, setTopupStep] = useState<'scan' | 'confirm'>('scan');

  useEffect(() => {
    loadBalance();
    loadTransactions();
  }, []);

  const loadBalance = async () => {
    try {
      const res: any = await walletApi.getBalance();
      setBalance(res.data);
    } catch (err) { console.error(err); }
  };

  const loadTransactions = async () => {
    try {
      const res: any = await walletApi.getTransactions();
      setTransactions(res.data || []);
    } catch (err) { console.error(err); }
  };

  const handleTopupConfirm = async () => {
    const amount = parseFloat(topupAmount);
    if (!amount || amount <= 0) {
      alert('请输入正确的金额');
      return;
    }
    try {
      await walletApi.topup(amount);
      alert('充值成功！');
      setShowTopup(false);
      setTopupAmount('');
      setTopupStep('scan');
      loadBalance();
      loadTransactions();
    } catch (err: any) {
      alert(err.message || '充值失败');
    }
  };

  const typeLabels: Record<string, string> = {
    topup: '充值',
    freeze: '冻结',
    unfreeze: '解冻退回',
    pay_out: '支出',
    earn: '收入',
    withdraw: '提现',
  };

  return (
    <div className="wallet-page">
      <div className="wallet-card">
        <div className="wallet-header">
          <h3>我的钱包</h3>
          <button className="topup-btn" onClick={() => setShowTopup(true)}>充值</button>
        </div>
        <div className="wallet-amounts">
          <div className="wallet-item">
            <div className="wallet-value">¥{Number(balance.balance).toFixed(2)}</div>
            <div className="wallet-label">可用余额</div>
          </div>
          <div className="wallet-item">
            <div className="wallet-value frozen">¥{Number(balance.frozen_balance).toFixed(2)}</div>
            <div className="wallet-label">冻结金额</div>
          </div>
        </div>
      </div>

      <div className="transactions-card">
        <h3>交易记录</h3>
        {transactions.length === 0 ? (
          <p className="no-transactions">暂无交易记录</p>
        ) : (
          <div className="transaction-list">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className={`transaction-item ${tx.related_task_id ? 'clickable' : ''}`}
                onClick={() => tx.related_task_id && navigate(`/task/${tx.related_task_id}`)}
              >
                <div className="tx-left">
                  <span className="tx-type">{typeLabels[tx.type] || tx.type}</span>
                  <span className="tx-desc">{tx.task_title || tx.description}</span>
                </div>
                <div className="tx-right">
                  <span className={`tx-amount ${tx.amount > 0 ? 'positive' : 'negative'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                  <span className="tx-time">{new Date(tx.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showTopup && (
        <div className="topup-overlay" onClick={() => setShowTopup(false)}>
          <div className="topup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="topup-modal-header">
              <h3>充值</h3>
              <button className="topup-close" onClick={() => setShowTopup(false)}>✕</button>
            </div>
            <div className="topup-body">
              <p className="topup-tip">输入充值金额（测试模式，直接到账）</p>
              <div className="topup-input-wrapper">
                <span className="topup-currency">¥</span>
                <input
                  type="number"
                  className="topup-input"
                  placeholder="输入金额"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="topup-quick-amounts">
                {[10, 20, 50, 100].map((amt) => (
                  <button key={amt} className="quick-amount-btn" onClick={() => setTopupAmount(String(amt))}>¥{amt}</button>
                ))}
              </div>
              <button className="topup-confirm-btn" onClick={handleTopupConfirm}>确认充值</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
