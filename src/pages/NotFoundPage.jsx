import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page-enter" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '60vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 className="text-display" style={{ 
        color: 'var(--sindoor)', 
        fontSize: '6rem', 
        marginBottom: '0',
        lineHeight: 1
      }}>404</h1>
      
      <h2 className="text-headline" style={{ 
        color: 'var(--text-primary)', 
        marginTop: '1rem',
        marginBottom: '1rem'
      }}>Oops! Wrong Pandal</h2>
      
      <p style={{ 
        color: 'var(--text-muted)', 
        fontSize: '1.125rem', 
        maxWidth: '500px', 
        margin: '0 auto 2rem auto',
        lineHeight: 1.6
      }}>
        It looks like you've taken a wrong turn while pandal hopping. The page you are looking for doesn't exist or has been moved.
      </p>
      
      <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className="material-symbols-outlined">home</span>
        Return to Home
      </Link>
    </div>
  );
}
