import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from '../components/icons';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Page not found');

  return (
    <div className="page notfound">
      <div className="shell notfound__inner">
        <p className="eyebrow">404</p>
        <h1 className="h2 notfound__title">This orbit leads nowhere.</h1>
        <p className="lead muted notfound__lead">
          The page you were looking for is not part of this system — or it has not
          been discovered yet.
        </p>
        <div className="notfound__actions">
          <Link className="btn btn--primary" to="/">
            <ArrowLeft className="btn__icon" />
            Back to Mind Matter
          </Link>
          <Link className="btn btn--ghost" to="/explore/solar-system">
            Explore the solar system
            <ArrowRight className="btn__icon" />
          </Link>
        </div>
      </div>
    </div>
  );
}
