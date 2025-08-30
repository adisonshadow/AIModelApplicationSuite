import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import AIModelSelector from './AIModelSelector/App';
import AIModelSender from './AIModelSender/App';
import './index.css';

const Navigation: React.FC = () => {
  return (
    <nav className="navigation">
      <div className="nav-container">
        <h1 className="nav-title">AI模型管理器</h1>
        <ul className="nav-links">
          <li>
            <Link to="/aimodel-selector" className="nav-link">AI模型选择器</Link>
          </li>
          <li>
            <Link to="/aimodel-sender" className="nav-link">AI模型发送器</Link>
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