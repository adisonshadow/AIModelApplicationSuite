import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import AIModelSelector from './AIModelSelector/App';
import UnbuildSelector from './UnbuildSelector/App';
import UnifiedAIChatTransceiver from './UnifiedAIChatTransceiver/App';
import './index.css';

// 导航组件
const Navigation: React.FC = () => {
  const location = useLocation();
  
  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="nav-brand">
          <h1>🤖 AI模型应用套件</h1>
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
              to="/unified_ai_chat_transceiver" 
              className={`nav-link ${location.pathname === '/unified_ai_chat_transceiver' ? 'active' : ''}`}
            >
              <span className="nav-icon">🚀</span>
              统一AI消息接发器
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
            <Route path="/unbuild-selector" element={<UnbuildSelector />} />
            <Route path="/unified_ai_chat_transceiver" element={<UnifiedAIChatTransceiver />} />
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