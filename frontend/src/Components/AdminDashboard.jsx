import React, { lazy, Suspense } from 'react'

import { Route, Routes } from 'react-router-dom'
import Navbar from '../Pages/Dashboard - Admin/AdminNavbar'
import Loading from './Loading'

const Profile = lazy(() => import('../Pages/Dashboard - Admin/Profile'))
const Contact = lazy(() => import('../Pages/Dashboard - User/Contact'))
const AdminHome = lazy(() => import('../Pages/Dashboard - Admin/AdminHome'))
const AdminIssues = lazy(() => import('../Pages/Dashboard - Admin/AdminIssues'))
const AnalyticsPage = lazy(() => import('../Pages/Dashboard - Admin/Analysis'))
const Help = lazy(() => import('../Pages/Dashboard - Admin/Help'))
const Settings = lazy(() => import('../Pages/Dashboard - Admin/Settings'))
const IssueDetails = lazy(() => import('../Pages/Common/IssueDetails'))
const CitizenMessages = lazy(() => import('../Pages/Dashboard - Admin/CitizenMessages'))

const AdminDashboard = () => {
  return (
    <div>
      <Navbar />

      <Suspense fallback={<Loading />}>
        <Routes>
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
      </Suspense>
    </div>
  )
}

export default AdminDashboard;
