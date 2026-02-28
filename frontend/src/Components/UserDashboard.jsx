import React from 'react'

import { Route, Routes } from 'react-router-dom'
import UserNavbar from '../Pages/Dashboard - User/DashboardNavbar'
import ReportIssue from '../Pages/Dashboard - User/ReportIssue'
import Body from '../Pages/Home/Body'
import Dashboard from '../Pages/Dashboard - User/Dashboard'
import Profile from '../Pages/Dashboard - User/Profile'
import Settings from '../Pages/Dashboard - User/Settings'
import Contact from '../Pages/Dashboard - User/Contact'
import UserIssueDetails from '../Pages/Dashboard - User/UserIssueDetails'
import UserIssues from '../Pages/Dashboard - User/UserIssues'
import Chatbot from './Chatbot'

const UserDashboard = () => {
  return (
    <div>
      <UserNavbar />

      <Routes>
        <Route path='/report' element={<ReportIssue />} />
        <Route path='/' element={<Dashboard />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/issue/:id' element={<UserIssueDetails />} />
        <Route path='/settings' element={<Settings />} />
        <Route path='/issues' element={<UserIssues />} />
      </Routes>

      {/* Floating Chatbot - available on all citizen pages */}
      <Chatbot />
    </div>
  )
}

export default UserDashboard
