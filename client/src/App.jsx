import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AddProduct from './Pages/Admin/AddProduct'
import Dashboard from './Pages/Admin/Dashboard'
import Scan from './Pages/Coustomer/Scan'
import ProductBatches from './Pages/Admin/ProductBatches'
import Resultpage from './Pages/Coustomer/Resultpage'
import LandingPage from './Pages/LandingPage'
import Settings from './Pages/Admin/Setting'
import Analytics from './Pages/Admin/Analytics'

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<LandingPage />} />
          <Route path='/scan' element={<Scan />} />
          <Route path='/result' element={<Resultpage />} />
          <Route path='/dashboard' element={<Dashboard />} />
          <Route path='/admin/addProduct' element={<AddProduct />} />
          <Route path='/admin/productBatch' element={<ProductBatches />} />
          <Route path='/admin/settings' element={<Settings />} />          
          <Route path='/admin/analytics' element={<Analytics />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
