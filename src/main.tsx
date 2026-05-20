import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './i18n';
import App from './App.tsx';
import { AppDialogProvider } from './components/AppDialogProvider';
import './index.css';
import { registerDevBuiltinAgentReset } from './dev/resetBuiltinAgents';

registerDevBuiltinAgentReset();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppDialogProvider>
      <App />
    </AppDialogProvider>
  </StrictMode>,
);
