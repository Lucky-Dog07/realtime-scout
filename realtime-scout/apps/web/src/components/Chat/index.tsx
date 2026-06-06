import { useState, useEffect, useRef } from 'react';
import { chatApi } from '../../services';
import { useAuthStore } from '../../store/authStore';
import './Chat.css';

interface Message {
  id: number;
  sender_id: number;
  content: string;
  type: string;
  nickname: string;
  username: string;
  created_at: string;
}

interface ChatProps {
  taskId: number;
  visible: boolean;
}

export default function Chat({ taskId, visible }: ChatProps) {
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!visible) return;
    loadMessages();
    pollRef.current = setInterval(loadMessages, 5000);
    return () => { clearInterval(pollRef.current); };
  }, [visible, taskId]);

  const loadMessages = async () => {
    try {
      const res: any = await chatApi.getMessages(taskId);
      setMessages(res.data || []);
    } catch {}
  };

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await chatApi.sendMessage(taskId, input.trim());
      setInput('');
      await loadMessages();
    } catch (err: any) {
      alert(err.message || '发送失败');
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setSending(true);
    try {
      await chatApi.sendFile(taskId, file);
      await loadMessages();
    } catch (err: any) {
      alert(err.message || '发送失败');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderContent = (msg: Message) => {
    if (msg.type === 'image') {
      return <img src={msg.content} alt="" className="chat-msg-img" />;
    }
    if (msg.type === 'video') {
      return <video src={msg.content} controls className="chat-msg-video" />;
    }
    return <span>{msg.content}</span>;
  };

  if (!visible) return null;

  return (
    <div className="chat-panel">
      <div className="chat-messages" ref={listRef}>
        {messages.length === 0 ? (
          <div className="chat-empty">暂无消息，发送第一条消息开始对话</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`chat-msg ${msg.sender_id === user?.id ? 'mine' : 'other'}`}>
              <div className="chat-msg-name">{msg.sender_id === user?.id ? '我' : (msg.nickname || msg.username)}</div>
              <div className="chat-msg-bubble">{renderContent(msg)}</div>
              <div className="chat-msg-time">{new Date(msg.created_at).toLocaleTimeString()}</div>
            </div>
          ))
        )}
      </div>
      <div className="chat-input-bar">
        <button className="chat-file-btn" onClick={() => fileRef.current?.click()} disabled={sending} title="发送图片/视频">
          +
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          hidden
        />
        <input
          type="text"
          placeholder="输入消息..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={handleSend} disabled={sending || !input.trim()}>发送</button>
      </div>
    </div>
  );
}
