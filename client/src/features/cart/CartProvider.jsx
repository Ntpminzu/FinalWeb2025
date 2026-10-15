import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { api } from '../../lib/http.js';
import { readGuestIds, writeGuestIds, checkoutAttempt } from './storage.js';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);
const emptyCart = { courses: [], total: 0, empty: true };

export function CartProvider({ children }) {
  const { user, ready } = useAuth();
  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    const update = (next) => {
      if (current === generation.current) setCart(next);
    };
    setLoading(true);
    setError(null);
    try {
      if (user?.role === 'student') {
        const owned = new Set((await api.request('/me/courses')).data.map((item) => item.courseId));
        const rejected = [];
        for (const id of readGuestIds()) {
          if (current !== generation.current) return;
          if (owned.has(id)) {
            writeGuestIds(readGuestIds().filter((value) => value !== id));
            continue;
          }
          try {
            await api.request('/cart/items', { method: 'POST', body: { courseId: id } });
            writeGuestIds(readGuestIds().filter((value) => value !== id));
          } catch (error) {
            if ([404, 409].includes(error.status)) {
              writeGuestIds(readGuestIds().filter((value) => value !== id));
              rejected.push(id);
            } else throw error;
          }
        }
        update((await api.request('/cart')).data);
        if (rejected.length && current === generation.current)
          setError(new Error('Một số khóa học trong giỏ khách không còn khả dụng.'));
      } else if (user) update(emptyCart);
      else {
        const courses = [];
        for (const id of readGuestIds()) {
          if (current !== generation.current) return;
          try {
            courses.push((await api.request(`/courses/${id}`, { auth: false })).data);
          } catch (error) {
            if (error.status === 404) writeGuestIds(readGuestIds().filter((value) => value !== id));
            else throw error;
          }
        }
        update({
          courses,
          total: courses.reduce((sum, course) => sum + Number(course.salePrice ?? course.price), 0),
          empty: !courses.length,
        });
      }
    } catch (error) {
      if (current === generation.current) setError(error);
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [user?.id, user?.role]);
  useEffect(() => {
    setCart(emptyCart);
    if (ready) refresh();
    const onStorage = (event) => {
      if (event.key === 'academy.guest-cart' && !user) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      generation.current++;
      window.removeEventListener('storage', onStorage);
    };
  }, [ready, refresh]);
  async function mutate(action) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      return await action();
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  const value = {
    ...cart,
    loading,
    busy,
    error,
    refresh,
    add: (id) =>
      mutate(async () => {
        if (user?.role === 'student')
          setCart(
            (await api.request('/cart/items', { method: 'POST', body: { courseId: id } })).data,
          );
        else if (!user) {
          writeGuestIds([...readGuestIds(), id]);
          await refresh();
        } else throw new Error('Giỏ hàng dành cho tài khoản học viên.');
      }),
    remove: (id) =>
      mutate(async () => {
        if (user?.role === 'student')
          setCart((await api.request(`/cart/items/${id}`, { method: 'DELETE' })).data);
        else {
          writeGuestIds(readGuestIds().filter((value) => value !== id));
          await refresh();
        }
      }),
    clear: () =>
      mutate(async () => {
        if (user?.role === 'student')
          setCart((await api.request('/cart', { method: 'DELETE' })).data);
        else {
          writeGuestIds([]);
          setCart(emptyCart);
        }
      }),
    checkout: () =>
      mutate(async () => {
        const attempt = checkoutAttempt(
          user.id,
          cart.courses.map((course) => course.id),
        );
        const { data } = await api.request('/checkout', {
          method: 'POST',
          body: { idempotencyKey: attempt.idempotencyKey, courseIds: attempt.courseIds },
        });
        sessionStorage.removeItem(`academy.checkout.${user.id}`);
        setCart(data.cart);
        return data;
      }),
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
