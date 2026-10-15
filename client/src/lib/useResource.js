import { useCallback, useEffect, useState } from 'react';
import { api } from './http.js';

export function useResource(path, { auth = true, enabled = true } = {}) {
  const [state, setState] = useState({ result: null, loading: enabled, error: null });
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    if (!enabled) {
      setState({ result: null, loading: false, error: null });
      return;
    }
    const controller = new AbortController();
    setState({ result: null, loading: true, error: null });
    api
      .request(path, { auth, signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setState({ result, loading: false, error: null });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ result: null, loading: false, error });
      });
    return () => controller.abort();
  }, [path, auth, enabled, version]);
  return { ...state, data: state.result?.data, reload };
}
