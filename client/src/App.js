import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Account from './pages/Account';
import MyOrders from './pages/MyOrders';
import ChangeName from './pages/AccountSettings/ChangeName';
import ChangeEmail from './pages/AccountSettings/ChangeEmail';
import ChangePassword from './pages/AccountSettings/ChangePassword';
import ChangeAddress from './pages/AccountSettings/ChangeAddress';
import RequestService from './pages/RequestService';
import ProviderApplication from './pages/ProviderApplication';
import ProviderDashboard from './pages/Provider/ProviderDashboard';
import AvailableJobs from './pages/Provider/AvailableJobs';
import MyJobs from './pages/Provider/MyJobs';
import ProviderProfile from './pages/Provider/Profile';
import ProviderApplications from './pages/Admin/ProviderApplications';
import NotFound from './pages/NotFound';
import MobileOnlyWrapper from './components/MobileOnlyWrapper';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';

const MAP_API_KEY = process.env.REACT_APP_MAP_API_KEY;

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <LoadScript googleMapsApiKey={MAP_API_KEY} libraries={['places', 'marker']}>
            <MobileOnlyWrapper>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />
                <Route path="/account" element={<Account />} />
                <Route path="/account/change-name" element={<ChangeName />} />
                <Route path="/account/change-email" element={<ChangeEmail />} />
                <Route path="/account/change-pass" element={<ChangePassword />} />
                <Route path="/account/change-address" element={<ChangeAddress />} />
                <Route path="/request" element={<RequestService />} />
                <Route path="/orders" element={<MyOrders />} />
                <Route path="/apply" element={<ProviderApplication />} />
                <Route path="/provider" element={<ProviderDashboard />} />
                <Route path="/provider/available" element={<AvailableJobs />} />
                <Route path="/provider/my-jobs" element={<MyJobs />} />
                <Route path="/provider/profile/:providerId" element={<ProviderProfile />} />
                <Route path="/admin/applications" element={<ProviderApplications />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </MobileOnlyWrapper>
          </LoadScript>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;