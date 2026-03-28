import React, { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import UserNavbar from '../Pages/Dashboard - User/DashboardNavbar'
import Loading from './Loading'
import Chatbot from './Chatbot'

const ReportIssue = lazy(() => import('../Pages/Dashboard - User/ReportIssue'))
const Dashboard = lazy(() => import('../Pages/Dashboard - User/Dashboard'))
const Profile = lazy(() => import('../Pages/Dashboard - User/Profile'))
const Settings = lazy(() => import('../Pages/Dashboard - User/Settings'))
const Contact = lazy(() => import('../Pages/Dashboard - User/Contact'))
const UserIssueDetails = lazy(() => import('../Pages/Dashboard - User/UserIssueDetails'))
const UserIssues = lazy(() => import('../Pages/Dashboard - User/UserIssues'))

const UserDashboard = () => {
  return (
    <div>
      <UserNavbar />

      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path='/report' element={<ReportIssue />} />
          <Route path='/' element={<Dashboard />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/issue/:id' element={<UserIssueDetails />} />
          <Route path='/settings' element={<Settings />} />
          <Route path='/issues' element={<UserIssues />} />
        </Routes>
      </Suspense>

      {/* Floating Chatbot - available on all citizen pages */}
      <Chatbot />
    </div>
  )
}

export default UserDashboard
