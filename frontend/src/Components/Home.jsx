import React from 'react'
import Navbar from '../Pages/Home/Navabar'
import { Route, Routes } from 'react-router-dom'
import Body from '../Pages/Home/Body'

const Home = () => {
  return (
    <div>
      <Navbar/>

      <Routes>
        <Route path='/' element={<Body/>} />
      </Routes>
    </div>
  )
}

export default Home
