export default function Stats({ items }) {
  return (
    <div className="row g-3 mb-4">
      {items.map(([label, value]) => (
        <div className="col-6 col-lg-3" key={label}>
          <div className="card card-body h-100">
            <span className="text-secondary small">{label}</span>
            <strong className="fs-3">{value ?? 0}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}
