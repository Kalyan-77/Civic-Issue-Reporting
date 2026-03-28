import React, { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import SuperAdminNavbar from '../Pages/SuperAdmin/SuperNavbar'
import Loading from './Loading'

const SuperCategoriesPage = lazy(() => import('../Pages/SuperAdmin/SuperCategories'))
const SuperAdminDashboard = lazy(() => import('../Pages/SuperAdmin/SuperDashboard'))
const Profile = lazy(() => import('../Pages/SuperAdmin/profile'))
const SuperIssues = lazy(() => import('../Pages/SuperAdmin/SuperIssues'))
const AdminManagenement = lazy(() => import('../Pages/SuperAdmin/AdminManagenement'))
const Analytics = lazy(() => import('../Pages/SuperAdmin/Analytics'))
const CreateAdmin = lazy(() => import('../Pages/SuperAdmin/CreateAdmin'))
const SuperSettings = lazy(() => import('../Pages/SuperAdmin/SuperSettings'))
const UserManagement = lazy(() => import('../Pages/SuperAdmin/UserManagement'))
const IssueDetails = lazy(() => import('../Pages/Common/IssueDetails'))
const SuperCitizenMessages = lazy(() => import('../Pages/SuperAdmin/SuperCitizenMessages'))

const SuperAdmin = () => {
  return (
    <div>
      <SuperAdminNavbar />

      <Suspense fallback={<Loading />}>
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
      </Suspense>
    </div>
  )
}

export default SuperAdmin
