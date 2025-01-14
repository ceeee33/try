import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Your custom CSS
import 'antd/dist/reset.css'; // Ant Design styles (use 'antd/dist/antd.css' for v4 or earlier)
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap styles
import App from './App';
// import { initializeApp } from "firebase/app";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);