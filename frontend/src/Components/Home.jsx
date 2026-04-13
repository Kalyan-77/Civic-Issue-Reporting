import React from 'react'
import Navbar from '../Pages/Home/Navabar'
import { Route, Routes } from 'react-router-dom'
import Body from '../Pages/Home/Body'
import Chatbot from './Chatbot'

const Home = () => {
  return (
    <div>
      <Navbar/>

      <Routes>
        <Route path='/' element={<Body/>} />
      </Routes>

      <Chatbot />
    </div>
  )
}

export default Home
