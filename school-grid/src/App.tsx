import { Routes, Route, Navigate } from 'react-router-dom';


import GetWay from './GetWay/GetWay';
import PageNotFound from './GetWay/PageNotFound';

import SupaerAdminDashBoard from './SuperAdmin/SupaerAdminDashBoard/SupaerAdminDashBoard';
import SchoolDashBoard from './SchoolPanel/SchoolDashBoard/SchoolDashBoard';


export default function App() {
  return (
    <>
      <Routes>
        
        <Route path='/' element={<GetWay />} />
        
        <Route path='super-admin-dashboard' element = {<SupaerAdminDashBoard/>} />
        <Route path='school-admin-dashboard' element = {<SchoolDashBoard/>} />


    </Routes>
    </>
  )
}