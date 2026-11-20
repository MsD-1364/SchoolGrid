import { Routes, Route, Navigate } from 'react-router-dom';

import GetWay from './GetWay/GetWay';
import ProtectedRoute from './GetWay/ProtectedRoute';
import PageNotFound from './GetWay/PageNotFound';

import SuperAdminDashBoard from './SuperAdmin/SuperAdminDashBoard/SuperAdminDashBoard';
import SchoolDashBoard from './SchoolPanel/SchoolDashBoard/SchoolDashBoard';
import PlaceholderPage from '../src/GetWay/PlaceHolderPage';


import AllStudentsInfo from './SuperAdmin/AllStudentsBox/AllStudentInfo'
import SuperAdminBoard from './SuperAdmin/SuperAdminDashBoard/SuperAdminBoard'
import AllSchoolsInfo from './SuperAdmin/AllSchoolsBox/AllSchoolInfo'
// import { DASHBOARD_PATHS, ROLES } from './lib/auth/Rules';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<GetWay />} />
      <Route path="/login" element={<GetWay />} />

      {/* Parent: sidebar + top bar. Children render in its <Outlet /> */}
      <Route path="/super-admin-dashboard" element={<SuperAdminDashBoard />}>
        
        <Route path="students" element={<AllStudentsInfo />} />
        <Route path="schools" element={<AllSchoolsInfo />} />

        <Route path="/super-admin-dashboard" element={<SuperAdminBoard />} />

      </Route>



      <Route path = '/school-dashboard' element = {< SchoolDashBoard/>}/>

    </Routes>



    
      
  );
}