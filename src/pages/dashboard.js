//change to the general dashboard

// import { useLocation, Navigate}from 'react-router-dom';
// import Sidebar from '../components/Sidebar';

// const Dashboard = () => {
//     const location = useLocation();
//     // Try to get state from location, fall back to localStorage
//     const role = location.state?.role || localStorage.getItem('userRole');
//     const name = location.state?.name || localStorage.getItem('userName');

//     // Redirect to login if no role is found
//     if (!role) {
//         return <Navigate to="/login" />;
//     }

//     return (
//         <div className="dashboard-layout">
//             <Sidebar userRole={role} />
//             <div className="dashboard-content">
//                 <div className="container">
//                     <h1>Dashboard</h1>
//                     <h2>Welcome, {name}</h2>
//                     <p>Your role is {role}</p>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Dashboard;