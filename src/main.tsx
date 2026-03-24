import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import Payroll from './pages/Payroll.tsx'
import Inventory from './pages/Inventory.tsx'
import MuleBonus from './pages/MuleBonus.tsx'
import Demo from './pages/Demo.tsx'
import StaffDemo from './pages/StaffDemo.tsx'
import InventoryDemo from './pages/InventoryDemo.tsx'
import MenuForge from './pages/MenuForge.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/payroll" element={<Payroll />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/mule" element={<MuleBonus />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/demo/staff" element={<StaffDemo />} />
        <Route path="/demo/inventory" element={<InventoryDemo />} />
        <Route path="/menuforge" element={<MenuForge />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
