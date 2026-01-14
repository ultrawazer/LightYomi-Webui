import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // Keep default styles if available, or empty file

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
