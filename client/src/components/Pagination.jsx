import { useSearchParams } from 'react-router';

export default function Pagination({ pagination }) {
  const [params, setParams] = useSearchParams();
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total } = pagination;
  const go = (next) => {
    const search = new URLSearchParams(params);
    search.set('page', next);
    setParams(search);
  };
  return (
    <nav
      className="d-flex justify-content-center align-items-center gap-3 mt-4"
      aria-label="Phân trang"
    >
      <button className="btn btn-outline-primary" disabled={page <= 1} onClick={() => go(page - 1)}>
        Trước
      </button>
      <span>
        Trang {page}/{totalPages} · {total} kết quả
      </span>
      <button
        className="btn btn-outline-primary"
        disabled={page >= totalPages}
        onClick={() => go(page + 1)}
      >
        Sau
      </button>
    </nav>
  );
}
