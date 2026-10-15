import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { api } from '../../lib/http.js';
import { ErrorMessage, Loading, NotFound } from '../../components/Feedback.jsx';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(api.getSession());
  const [error, setError] = useState(null);
  const channel = useRef(null);
  async function restore() {
    setError(null);
    try {
      await api.bootstrap();
    } catch (error) {
      setError(error);
    }
  }
  useEffect(() => {
    const unsubscribe = api.subscribe(setSession);
    restore();
    channel.current =
      typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('academy-session') : null;
    if (channel.current)
      channel.current.onmessage = (event) => {
        api.clearSession();
        if (event.data === 'login') restore();
      };
    return () => {
      unsubscribe();
      channel.current?.close();
    };
  }, []);
  const value = {
    ...session,
    error,
    restore,
    async login(body) {
      const user = await api.login(body);
      channel.current?.postMessage('login');
      return user;
    },
    async register(body) {
      const user = await api.register(body);
      channel.current?.postMessage('login');
      return user;
    },
    async logout() {
      await api.logout();
      channel.current?.postMessage('logout');
    },
    async reloadUser() {
      await api.bootstrap();
    },
    clearSession() {
      api.clearSession();
      channel.current?.postMessage('logout');
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function RequireAuth({ roles }) {
  const auth = useAuth();
  const location = useLocation();
  if (!auth.ready) return <Loading />;
  if (auth.error)
    return (
      <>
        <ErrorMessage error={auth.error} />
        <button className="btn btn-primary" onClick={auth.restore}>
          Kết nối lại
        </button>
      </>
    );
  if (!auth.user)
    return (
      <Navigate
        to={`/account/signin?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  if (roles && !roles.includes(auth.user.role)) return <NotFound forbidden />;
  return <Outlet />;
}
