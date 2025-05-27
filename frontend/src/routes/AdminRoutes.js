import React from 'react';
import { Route } from 'react-router-dom';
import EmailQueueDashboard from '../components/admin/EmailQueueDashboard';

const AdminRoutes = () => {
  return (
    <>
      <Route path="/admin/email-queue" element={<EmailQueueDashboard />} />
      {/* ... other admin routes ... */}
    </>
  );
};

export default AdminRoutes; 