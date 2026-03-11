export default function Card({ title, subtitle, action, children, className = "", style = {} }) {
  return (
    <div className={`card ${className}`} style={style}>
      {(title || action) && (
        <div className="card-header">
          <div>
            {title && <div className="card-title">{title}</div>}
            {subtitle && <div className="card-sub">{subtitle}</div>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
