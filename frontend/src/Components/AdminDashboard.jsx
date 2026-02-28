import React from 'react'

import { Route, Routes } from 'react-router-dom'
import Profile from '../Pages/Dashboard - Admin/Profile'
import Contact from '../Pages/Dashboard - User/Contact'
import AdminHome from '../Pages/Dashboard - Admin/AdminHome'
import Navbar from '../Pages/Dashboard - Admin/AdminNavbar'
import AdminIssues from '../Pages/Dashboard - Admin/AdminIssues'
import AnalyticsPage from '../Pages/Dashboard - Admin/Analysis'
import Help from '../Pages/Dashboard - Admin/Help'
import Settings from '../Pages/Dashboard - Admin/Settings'
import IssueDetails from '../Pages/Common/IssueDetails'
import CitizenMessages from '../Pages/Dashboard - Admin/CitizenMessages'

const AdminDashboard = () => {
  return (
    <div>
      <Navbar />

      <Routes>
        {/* <Route path='/report' element={<ReportIssue/>} /> */}
        <Route path='/' element={<AdminHome />} />
        <Route path='/issues' element={<AdminIssues />} />
        <Route path='/issues/:id' element={<IssueDetails />} />
        <Route path='/analysis' element={<AnalyticsPage />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/settings' element={<Settings />} />
        <Route path='/help' element={<Help />} />
        <Route path='/messages' element={<CitizenMessages />} />
      </Routes>
    </div>
  )
}

export default AdminDashboard;
