import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/AuthProvider.jsx';
import { api } from '../../lib/http.js';
import './chatbot.css';

const suggestions = {
  guest: ['Tôi muốn học React, có khóa học nào phù hợp?', 'Làm sao đăng ký tài khoản học viên?'],
  student: ['Tôi muốn học React, có khóa học nào phù hợp?', 'Làm sao vào học khóa đã mua?'],
  instructor: ['Làm sao tạo khóa học mới?', 'Làm sao quản lý bài giảng của tôi?'],
  admin: ['Làm sao ẩn một khóa học?', 'Làm sao quản lý danh mục?'],
};

export default function ChatbotWidget() {
  const { user, ready } = useAuth();
  const role = user?.role || 'guest';
  const identity = `${user?.id || 'guest'}:${role}`;
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [health, setHealth] = useState(null);
  const history = useRef([]);
  const pending = useRef(null);
  const healthRequest = useRef(null);
  const alive = useRef(true);
  const input = useRef(null);
  const launcher = useRef(null);
  const conversation = useRef(null);

  useEffect(() => () => {
    alive.current = false;
    pending.current?.abort();
    healthRequest.current?.abort();
  }, []);
  useEffect(() => {
    if (open) { input.current?.focus(); checkHealth(); }
  }, [open]);
  useEffect(() => {
    if (conversation.current) conversation.current.scrollTop = conversation.current.scrollHeight;
  }, [messages, busy]);

  function currentIdentity() {
    const current = api.getSession().user;
    return `${current?.id || 'guest'}:${current?.role || 'guest'}`;
  }
  function close() {
    setOpen(false);
    launcher.current?.focus();
  }
  async function checkHealth() {
    healthRequest.current?.abort();
    const controller = new AbortController();
    healthRequest.current = controller;
    try {
      const result = await api.request('/chatbot/health', { auth: false, signal: controller.signal });
      if (alive.current && !controller.signal.aborted) setHealth(result.data);
    } catch (error) {
      if (alive.current && !controller.signal.aborted) setHealth({ ready: false, message: error.message });
    }
  }
  async function submit(event) {
    event.preventDefault();
    const text = question.trim();
    if (!text || pending.current || !ready) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError(null);
    setMessages(previous => [...previous, { role: 'user', text }]);
    setQuestion('');
    try {
      const { data } = await api.request('/chatbot/messages', {
        auth: Boolean(user), method: 'POST', signal: controller.signal,
        body: { question: text, history: history.current },
      });
      if (!alive.current || controller.signal.aborted || currentIdentity() !== identity) return;
      history.current = [...history.current, { role: 'user', content: text },
        { role: 'assistant', content: data.answer }].slice(-6)
        .map(message => ({ ...message, content: message.content.slice(0, 1000) }));
      setMessages(previous => [...previous, { role: 'assistant', text: data.answer,
        sources: data.sources, warnings: data.warnings }]);
      setHealth(previous => ({ ...previous, ready: true, message: 'Trợ lý sẵn sàng.' }));
    } catch (error) {
      if (alive.current && !controller.signal.aborted && currentIdentity() === identity) {
        setError(error.message);
        if ([502, 503, 504].includes(error.status)) checkHealth();
      }
    } finally {
      if (alive.current && currentIdentity() === identity) {
        pending.current = null;
        setBusy(false);
        input.current?.focus();
      }
    }
  }
  function reset() {
    history.current = [];
    setMessages([]);
    setQuestion('');
    setError(null);
    input.current?.focus();
  }
  return (
    <div className="academy-chatbot">
      {open && (
        <section className="chatbot-panel" role="dialog" aria-labelledby="chatbot-title"
          id="academy-chatbot-panel" onKeyDown={event => { if (event.key === 'Escape') close(); }}>
          <header className="chatbot-header">
            <div><h2 id="chatbot-title">Trợ lý Online Academy</h2><small>Tư vấn khóa học · Hướng dẫn website</small></div>
            <button type="button" className="chatbot-icon-button" onClick={close} aria-label="Đóng trợ lý">×</button>
          </header>
          <div className="chatbot-health" role="status">
            {health?.message || 'Đang kiểm tra trợ lý…'}
            {health?.ready === false && <button type="button" onClick={checkHealth}>Kiểm tra lại</button>}
          </div>
          <div className="chatbot-conversation" ref={conversation} role="log" aria-live="polite" aria-relevant="additions text">
            {!messages.length && <p className="chatbot-intro">Bạn muốn tìm khóa học hay cần hướng dẫn sử dụng website? Câu trả lời có nguồn để bạn đối chiếu.</p>}
            {messages.map((message, i) => (
              <article className={`chatbot-message chatbot-${message.role}`} key={i}>
                <strong>{message.role === 'user' ? 'Bạn' : 'Trợ lý'}</strong>
                <p>{message.text}</p>
                {message.sources?.length > 0 && (
                  <details className="chatbot-sources"><summary>Nguồn tham khảo ({message.sources.length})</summary>
                    {message.sources.map(source => (
                      <div className="chatbot-source" key={source.id}>
                        <Link to={source.url}>[{source.citation}] {source.title}</Link>
                        <p>{source.excerpt}</p>
                      </div>
                    ))}
                  </details>
                )}
                {message.warnings?.map((warning, index) => <p className="chatbot-warning" key={index}>{warning}</p>)}
              </article>
            ))}
            {busy && <p role="status">Đang trả lời… Lượt đầu có thể cần đồng bộ tài liệu và tải model.</p>}
          </div>
          {!messages.length && <div className="chatbot-suggestions">
            {(suggestions[role] || suggestions.guest).map(text => (
              <button type="button" key={text} onClick={() => { setQuestion(text); input.current?.focus(); }}>{text}</button>
            ))}
          </div>}
          {error && <p className="chatbot-error" role="alert">{error}</p>}
          <form className="chatbot-form" onSubmit={submit}>
            <label htmlFor="chatbot-question" className="visually-hidden">Câu hỏi cho trợ lý</label>
            <textarea id="chatbot-question" ref={input} value={question} maxLength={2000} rows={2}
              required placeholder="Nhập câu hỏi của bạn…" onChange={event => setQuestion(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault(); event.currentTarget.form.requestSubmit();
                }
              }} />
            <div className="chatbot-form-actions">
              <button type="button" onClick={reset} disabled={busy}>Cuộc trò chuyện mới</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !ready || !question.trim()}>Gửi</button>
            </div>
            <small>Enter để gửi · Shift + Enter xuống dòng. Tải lại trang sẽ xóa hội thoại.</small>
          </form>
        </section>
      )}
      <button ref={launcher} type="button" className="chatbot-launcher" disabled={!ready}
        aria-label={open ? 'Thu gọn trợ lý' : 'Mở trợ lý'} aria-expanded={open}
        aria-controls="academy-chatbot-panel" onClick={() => open ? close() : setOpen(true)}>
        <i className={`bi ${open ? 'bi-chevron-down' : 'bi-chat-dots-fill'}`} aria-hidden="true" />
      </button>
    </div>
  );
}
