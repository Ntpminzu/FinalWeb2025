import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/style.css';
import './styles/react.css';
import App from './app/App.jsx';
import Providers from './app/providers.jsx';
import { ErrorBoundary } from './components/Feedback.jsx';

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter>
      <Providers>
        <App />
      </Providers>
    </BrowserRouter>
  </ErrorBoundary>,
);
