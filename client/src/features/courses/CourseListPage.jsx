import { useParams, useSearchParams } from 'react-router';
import { useResource } from '../../lib/useResource.js';
import { useCategories } from '../../app/providers.jsx';
import { ResourceState } from '../../components/Feedback.jsx';
import Pagination from '../../components/Pagination.jsx';
import { CourseGrid } from './CourseCard.jsx';

export default function CourseListPage() {
  const { categoryId } = useParams();
  const [params, setParams] = useSearchParams();
  const categories = useCategories();
  const query = new URLSearchParams(params);
  const path = categoryId
    ? `/categories/${categoryId}/courses?page=${params.get('page') || 1}`
    : `/courses?${query}`;
  const resource = useResource(path, { auth: false });
  const category = resource.result?.category;
  function change(key, value) {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    next.delete('page');
    setParams(next);
  }
  return (
    <section className="py-3">
      <div className="section-heading">
        <div>
          <span className="section-kicker">Khám phá</span>
          <h1>
            {categoryId
              ? category?.name || category?.catname || 'Khóa học theo danh mục'
              : params.get('q')
                ? `Kết quả cho “${params.get('q')}”`
                : 'Tất cả khóa học'}
          </h1>
        </div>
      </div>
      {!categoryId && (
        <div className="card card-body mb-4">
          <form
            className="row g-3 align-items-end"
            key={params.get('q') || ''}
            onSubmit={(event) => {
              event.preventDefault();
              change('q', new FormData(event.currentTarget).get('q'));
            }}
          >
            <div className="col-md-5">
              <label className="form-label" htmlFor="course-query">
                Từ khóa
              </label>
              <input
                id="course-query"
                className="form-control"
                name="q"
                maxLength={200}
                defaultValue={params.get('q') || ''}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="category-filter">
                Danh mục
              </label>
              <select
                id="category-filter"
                className="form-select"
                value={params.get('categoryId') || ''}
                onChange={(event) => change('categoryId', event.target.value)}
              >
                <option value="">Tất cả</option>
                {categories.flat.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="course-sort">
                Sắp xếp
              </label>
              <select
                id="course-sort"
                className="form-select"
                value={params.get('sort') || (params.get('q') ? 'relevance' : 'newest')}
                onChange={(event) => change('sort', event.target.value)}
              >
                {[
                  ['relevance', 'Liên quan'],
                  ['newest', 'Mới nhất'],
                  ['popular', 'Phổ biến'],
                  ['rating_desc', 'Đánh giá cao'],
                  ['price_asc', 'Giá tăng dần'],
                  ['price_desc', 'Giá giảm dần'],
                ].map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-1">
              <button className="btn btn-primary w-100">Tìm</button>
            </div>
          </form>
        </div>
      )}
      <ResourceState resource={resource}>
        <CourseGrid courses={resource.data} />
        <Pagination pagination={resource.result?.pagination} />
      </ResourceState>
    </section>
  );
}
