import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import AIModelSelector from './AIModelSelector/App';
import SimpleSender from './Simple-sender/App';
import AdvancedSender from './Advanced-sender/App';
import OpenAIStreamDemo from './OpenAI-Stream-Demo/App';
import UnbuildSelector from './UnbuildSelector/App';
import UnifiedAIChatTransceiver from './UnifiedAIChatTransceiver/App';
import UnbuildAIChatTransceiver from './UnbuildUnifiedAIChatTransceiver/App';
import './index.css';

// 导航组件
const Navigation: React.FC = () => {
  const location = useLocation();
  
  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="nav-brand">
          <h1>🤖 Examples</h1>
        </div>
        <ul className="nav-menu">
          <li style={{ display: 'flex', gap: '2px' }}>
            <Link 
              to="/unbuild-selector" 
              className={`nav-link ${location.pathname === '/unbuild-selector' ? 'active' : ''}`}
            >
              <span className="nav-icon">🚀</span>
              AI Model Selector
            </Link>
          </li>

          <li style={{ display: 'flex', gap: '2px' }}>

            <Link 
              to="/simple-sender" 
              className={`nav-link ${location.pathname === '/simple-sender' ? 'active' : ''}`}
            >
              Simple Sender
            </Link>
            <Link 
              to="/advanced-sender" 
              className={`nav-link ${location.pathname === '/advanced-sender' ? 'active' : ''}`}
            >
              Advanced Sender
            </Link>
            {/* <Link 
              to="/openai-stream-demo" 
              className={`nav-link ${location.pathname === '/openai-stream-demo' ? 'active' : ''}`}
            >
              OpenAI Stream
            </Link> */}
            
            <Link 
              to="/unbuild_ai_chat_transceiver" 
              className={`nav-link ${location.pathname === '/unbuild_ai_chat_transceiver' ? 'active' : ''}`}
            >
              🚚 Combined
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
            <Route path="/" element={<Navigate to="/simple-sender" replace />} />
            <Route path="/aimodel-selector" element={<AIModelSelector />} />
            <Route path="/advanced-sender" element={<AdvancedSender />} />
            <Route path="/simple-sender" element={<SimpleSender />} />
            <Route path="/openai-stream-demo" element={<OpenAIStreamDemo />} />
            <Route path="/unbuild-selector" element={<UnbuildSelector />} />
            <Route path="/unified_ai_chat_transceiver" element={<UnifiedAIChatTransceiver />} />
            <Route path="/unbuild_ai_chat_transceiver" element={<UnbuildAIChatTransceiver />} />
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