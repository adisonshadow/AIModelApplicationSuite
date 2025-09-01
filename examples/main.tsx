import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import AIModelSelector from './AIModelSelector/App';
import AIModelSender from './AIModelSender/App';
import AIModelSender2 from './AIModelSender/App2';
import './index.css';

// 导航组件
const Navigation: React.FC = () => {
  const location = useLocation();
  
  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="nav-brand">
          <h1>🤖 AI模型管理器</h1>
        </div>
        <ul className="nav-menu">
          <li>
            <Link 
              to="/aimodel-selector" 
              className={`nav-link ${location.pathname === '/aimodel-selector' ? 'active' : ''}`}
            >
              <span className="nav-icon">⚙️</span>
              AI模型选择器
            </Link>
          </li>
          <li>
            <Link 
              to="/aimodel-sender" 
              className={`nav-link ${location.pathname === '/aimodel-sender' ? 'active' : ''}`}
            >
              <span className="nav-icon">🚀</span>
              AI模型发送器
            </Link>
          </li>
          <li>
            <Link 
              to="/aimodel-sender2" 
              className={`nav-link ${location.pathname === '/aimodel-sender2' ? 'active' : ''}`}
            >
              <span className="nav-icon">🚀</span>
              AI模型发送器2
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/aimodel-selector" replace />} />
            <Route path="/aimodel-selector" element={<AIModelSelector />} />
            <Route path="/aimodel-sender" element={<AIModelSender />} />
            <Route path="/aimodel-sender2" element={<AIModelSender2 />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);