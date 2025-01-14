import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import './StudentApplication.css';

function StudentApplication() {
  const [applications, setApplications] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', school: 'School A', date: '2024-12-26', status: 'Pending' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', school: 'School B', date: '2024-12-25', status: 'Approved' },
    { id: 3, name: 'Sam Wilson', email: 'sam@example.com', school: 'School C', date: '2024-12-24', status: 'Rejected' },
  ]);

  const [filter, setFilter] = useState('All'); // Default filter to show all applications

  const handleFilterChange = (status) => {
    setFilter(status);
  };

  const filteredApplications = applications.filter(
    (app) => filter === 'All' || app.status === filter
  );

  const stats = {
    pending: applications.filter((app) => app.status === 'Pending').length,
    approved: applications.filter((app) => app.status === 'Approved').length,
    rejected: applications.filter((app) => app.status === 'Rejected').length,
    total: applications.length,
  };

  return (
    <div className="dashboard-layout">
      <Sidebar userRole="admin" /> {/* Include Sidebar */}
      <div className="dashboard-content">
        <h1>Student Donation Application Dashboard</h1>

        {/* Stats Cards in 2x2 Grid */}
        <div className="stats-grid">
          <div className="stat-card yellow" onClick={() => handleFilterChange('Pending')}>
            <h2>{stats.pending}</h2>
            <p>Pending</p>
          </div>
          <div className="stat-card green" onClick={() => handleFilterChange('Approved')}>
            <h2>{stats.approved}</h2>
            <p>Approved</p>
          </div>
          <div className="stat-card red" onClick={() => handleFilterChange('Rejected')}>
            <h2>{stats.rejected}</h2>
            <p>Rejected</p>
          </div>
          <div className="stat-card gray" onClick={() => handleFilterChange('All')}>
            <h2>{stats.total}</h2>
            <p>Total</p>
          </div>
        </div>

        {/* Applications Table */}
        <div className="applications-table">
          <h2>{filter === 'All' ? 'Total Applications' : `${filter} Applications`}</h2>
          <table>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">School</th>
                <th scope="col">Date</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((app) => (
                <tr key={app.id}>
                  <td>{app.name}</td>
                  <td>{app.email}</td>
                  <td>{app.school}</td>
                  <td>{app.date}</td>
                  <td className={`status ${app.status.toLowerCase()}`}>{app.status}</td>
                  <td>
                    {app.status === 'Pending' && (
                      <>
                        <button
                          className="approve-btn"
                          onClick={() =>
                            setApplications((prev) =>
                              prev.map((a) =>
                                a.id === app.id ? { ...a, status: 'Approved' } : a
                              )
                            )
                          }
                        >
                          Approve
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() =>
                            setApplications((prev) =>
                              prev.map((a) =>
                                a.id === app.id ? { ...a, status: 'Rejected' } : a
                              )
                            )
                          }
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StudentApplication;

