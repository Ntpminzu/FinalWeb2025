import { useSearchParams } from 'react-router';
export default function ManagementFilters({ users = false, categories = [] }) {
  const [params, setParams] = useSearchParams();
  function submit(event) {
    event.preventDefault();
    const next = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget)) if (value) next.set(key, value);
    setParams(next);
  }
  return (
    <form className="card card-body mb-4" onSubmit={submit} key={params.toString()}>
      <div className="row g-2 align-items-end">
        <div className="col-md">
          <label className="form-label" htmlFor="management-q">
            Tìm kiếm
          </label>
          <input
            className="form-control"
            id="management-q"
            name="q"
            maxLength={200}
            defaultValue={params.get('q') || ''}
          />
        </div>
        <div className="col-md">
          <label className="form-label" htmlFor="management-disabled">
            Trạng thái
          </label>
          <select
            id="management-disabled"
            name="disabled"
            className="form-select"
            defaultValue={params.get('disabled') || ''}
          >
            <option value="">Tất cả</option>
            <option value="false">Đang hoạt động</option>
            <option value="true">Đã khóa</option>
          </select>
        </div>
        {users && (
          <div className="col-md">
            <label className="form-label" htmlFor="management-role">
              Vai trò
            </label>
            <select
              id="management-role"
              className="form-select"
              name="permission"
              defaultValue={params.get('permission') || ''}
            >
              <option value="">Tất cả</option>
              <option value="1">Học viên</option>
              <option value="2">Giảng viên</option>
              <option value="3">Quản trị</option>
            </select>
          </div>
        )}
        {categories.length > 0 && (
          <div className="col-md">
            <label className="form-label" htmlFor="management-category">
              Danh mục
            </label>
            <select
              id="management-category"
              className="form-select"
              name="categoryId"
              defaultValue={params.get('categoryId') || ''}
            >
              <option value="">Tất cả</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="col-md-auto">
          <button className="btn btn-primary">Lọc</button>
        </div>
      </div>
    </form>
  );
}
