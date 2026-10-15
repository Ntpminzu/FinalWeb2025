import { useState } from 'react';
import { useResource } from '../../lib/useResource.js';
import { api } from '../../lib/http.js';
import { ResourceState, ErrorMessage } from '../../components/Feedback.jsx';
import { CourseGrid } from '../courses/CourseCard.jsx';

export default function WatchlistPage() {
  const resource = useResource('/me/watchlist');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  async function remove(id) {
    setBusy(true);
    setError(null);
    try {
      await api.request(`/me/watchlist/items/${id}`, { method: 'DELETE' });
      resource.reload();
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <h1>Danh sách yêu thích</h1>
      <ErrorMessage error={error} />
      <ResourceState resource={resource}>
        <CourseGrid courses={resource.data}>
          {(course) => (
            <button
              className="btn btn-outline-danger w-100 mt-2"
              disabled={busy}
              onClick={() => remove(course.id)}
            >
              Bỏ yêu thích
            </button>
          )}
        </CourseGrid>
      </ResourceState>
    </section>
  );
}
