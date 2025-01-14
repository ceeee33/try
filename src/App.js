import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserRoleSelection from './pages/Auth/UserRoleSelection';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import './App.css';
import ResourceRequestForm from './pages/Student/requestform';
import StudentDashboard from './pages/Student/studentDashboard';
import AdminDashboard from './pages/admin/adminDashboard';
import Inventory from './pages/admin/inventory';
import QRScanner from './pages/admin/QRScanner';
import Notifications from './pages/admin/notifications';
import DonorDashboard from './pages/donor/donorDashboard';
import ItemList from './pages/Student/itemList';
import DonationHistory from './pages/donor/DonationHistory';
import CollectionHistory from './pages/Student/collectionHistory';
import DonorApplication from "./pages/Review/DonorApplication";
import StudentApplication from './pages/Review/StudentApplication';
import Suggestion from './pages/donor/Suggestion';
import Settings from './pages/admin/Settings';
import AdminChat from './components/AdminChat';

function App() {

  return (
    <>
    <Router>
      <Routes>
        <Route path="/" element={<UserRoleSelection />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/requestform" element={<ResourceRequestForm />} />
        <Route path="/studentDashboard" element={<StudentDashboard/>}/>
        <Route path="/adminDashboard" element = {<AdminDashboard/>}/>
        <Route path="/donorDashboard" element = {<DonorDashboard/>}/>
        <Route path="/itemList" element ={<ItemList/>}/>
        <Route path="/inventory" element ={<Inventory/>}/>
        <Route path="/qrscanner" element ={<QRScanner/>}/>
        <Route path="/notifications" element ={<Notifications />}/>
        <Route path="/donor/history" element={<DonationHistory />} />
        <Route path="/collectionHistory" element ={<CollectionHistory/>}/>
        <Route path="/student-application" element={<StudentApplication />} />
        <Route path="/donor-application" element={<DonorApplication />} />
        <Route path="/suggestion" element={<Suggestion />} />
        <Route path='/settings' element={<Settings />} />
        <Route path="/admin/chat" element={<AdminChat />} />
      </Routes>
    </Router>
    </>
  );
}

export default App;