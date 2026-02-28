import React from 'react'
import { Routes, Route } from 'react-router-dom'
import SuperCategoriesPage from '../Pages/SuperAdmin/SuperCategories'
import SuperAdminNavbar from '../Pages/SuperAdmin/SuperNavbar'
import SuperAdminDashboard from '../Pages/SuperAdmin/SuperDashboard'
import Profile from '../Pages/SuperAdmin/profile'
import SuperIssues from '../Pages/SuperAdmin/SuperIssues'
import AdminManagenement from '../Pages/SuperAdmin/AdminManagenement'
import Analytics from '../Pages/SuperAdmin/Analytics'
import CreateAdmin from '../Pages/SuperAdmin/CreateAdmin'
import SuperSettings from '../Pages/SuperAdmin/SuperSettings'
import UserManagement from '../Pages/SuperAdmin/UserManagement'
import IssueDetails from '../Pages/Common/IssueDetails'
import SuperCitizenMessages from '../Pages/SuperAdmin/SuperCitizenMessages'

const SuperAdmin = () => {
  return (
    <div>
      <SuperAdminNavbar />

      <Routes>
        <Route path='/' element={<SuperAdminDashboard />} />
        <Route path='/messages' element={<SuperCitizenMessages />} />
        <Route path='/issues' element={<SuperIssues />} />
        <Route path='/issues/:id' element={<IssueDetails />} />
        <Route path='/admins' element={<AdminManagenement />} />
        <Route path='/users' element={<UserManagement />} />
        <Route path='/categories' element={<SuperCategoriesPage />} />
        <Route path='/analytics' element={<Analytics />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/create-admin' element={<CreateAdmin />} />
        <Route path='/settings' element={<SuperSettings />} />
      </Routes>
    </div>
  )
}

export default SuperAdmin
