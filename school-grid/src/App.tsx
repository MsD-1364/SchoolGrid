import { Routes, Route, Navigate } from 'react-router-dom';


import GetWay from './GetWay/GetWay';
import PageNotFound from './GetWay/PageNotFound';

import SuperAdminDashBoard from './SuperAdmin/SuperAdminDashBoard/SuperAdminDashBoard';
import SchoolDashBoard from './SchoolPanel/SchoolDashBoard/SchoolDashBoard';
import Dashboard from './SuperAdmin/SuperAdminDashBoard/AdminDashboard'

export default function App() {
  return (
    <>
      <Routes>
        
        <Route path='/' element={<GetWay />} />
        <Route path='/login' element={<GetWay />} />

        
        <Route path='/super-admin-dashboard' element = {<SuperAdminDashBoard/>} />
        <Route path='/dashboard' element = {<Dashboard/>} />

        <Route path='school-admin-dashboard' element = {<SchoolDashBoard/>} />


    </Routes>
    </>
  )
}