export default function PageHeader({ title, description, breadcrumb }) {
  return (
    <div className="pageHeader">
      {breadcrumb && <div className="pageBreadcrumb">{breadcrumb}</div>}
      <div className="pageTitleRow">
        <div>
          <h1 className="pageTitle">{title}</h1>
          {description && (
            <p className="pageSubtitle">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


