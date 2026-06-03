import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { FlowProvider } from './store/FlowContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FlowProvider>
      <App />
    </FlowProvider>
  </StrictMode>,
)
