import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import AddProduct from './Pages/Admin/AddProduct'
import Dashboard from './Pages/Admin/Dashboard'
import Scan from './Pages/Coustomer/Scan'
import ProductBatches from './Pages/Admin/ProductBatches'
import Resultpage from './Pages/Coustomer/Resultpage'


function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/scan' element={<Scan />} />
          <Route path='/result' element={<Resultpage />} />
          <Route path='/' element={<Dashboard />} />
          <Route path='/admin/add-product' element={<AddProduct />} />
          <Route path='/admin/product-batch' element={<ProductBatches />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
