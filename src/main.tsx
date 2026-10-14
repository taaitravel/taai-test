import { captureFirstTouchAttribution } from '@/lib/attribution/utm'
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

captureFirstTouchAttribution()

createRoot(document.getElementById("root")!).render(<App />);
