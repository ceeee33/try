import React, { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Sidebar from '../../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import ChatButton from '../../components/ChatButton';
import ChatDialog from '../../components/ChatDialog';

const StudentDashboard = () => {
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [recentCollections, setRecentCollections] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [metrics, setMetrics] = useState({
    totalItems: 0,
    topCategory: '-',
  });
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('userRole');
  const name = localStorage.getItem('userName');
  const navigate = useNavigate(); 

  useEffect(() => {
    fetchCollectionData();
    fetchRecentCollections();
  }, [userId]);

  const fetchRecentCollections = async () => {
    const db = getFirestore();
    const historyRef = collection(db, 'collectionHistory');
    const q = query(
      historyRef,
      where('userId', '==', userId),
      orderBy('collectedAt', 'desc'),
      limit(5)
    );

    try {
      const querySnapshot = await getDocs(q);
      const collections = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.collectedAt?.toDate() || new Date(),
          category: data.category,
          itemName: data.itemName,
          quantity: data.numItem || 1,
          status: data.status || 'Collected',
        };
      });
      setRecentCollections(collections);
    } catch (error) {
      console.error('Error fetching recent collections:', error);
    }
  };

  const fetchCollectionData = async () => {
    const db = getFirestore();
    const historyRef = collection(db, 'collectionHistory');
    const userQuery = query(historyRef, where('userId', '==', userId));
  
    try {
      const querySnapshot = await getDocs(userQuery);
      const items = querySnapshot.docs.map(doc => doc.data());
  
      // Calculate total items (sum of all quantities)
      const totalItems = items.reduce((sum, item) => sum + (item.numItem || 0), 0);
  
      // Count items by category based on quantity
      const categoryCount = items.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + (item.numItem || 0);
        return acc;
      }, {});
  
      // Get the top category based on total quantity
      const topCategory = Object.entries(categoryCount).length > 0
        ? Object.entries(categoryCount).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
        : '-';
  
      // Update metrics
      setMetrics({
        totalItems: totalItems,
        topCategory: topCategory,
      });
  
      // Prepare pie chart data
      const pieData = Object.entries(categoryCount).map(([name, value]) => ({
        name,
        value,
      }));
      setCategoryData(pieData);
  
      // Prepare monthly data for the line chart
      const monthlyCount = items.reduce((acc, item) => {
        const date = new Date(item.collectedAt?.seconds * 1000);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        acc[monthYear] = (acc[monthYear] || 0) + (item.numItem || 0);
        return acc;
      }, {});
  
      const lineData = Object.entries(monthlyCount)
        .sort((a, b) => {
          const [monthA, yearA] = a[0].split('/');
          const [monthB, yearB] = b[0].split('/');
          return new Date(yearA, monthA) - new Date(yearB, monthB);
        })
        .map(([date, count]) => ({
          date,
          count,
        }));
      setMonthlyData(lineData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        <Sidebar userRole={role} />
      </div>
      <div className="dashboard-content p-6">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-6">Student Dashboard</h1>
          <h2 className="text-xl mb-8">Welcome, {name}</h2>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600">Total Items Collected</p>
              <p className="text-3xl font-bold">{metrics.totalItems}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600">Most Collected Category</p>
              <p className="text-3xl font-bold">{metrics.topCategory}</p>
            </div>
          </div>

          {/* Recent Collections Table */}
          <div className="bg-white rounded-lg shadow mb-8">
          <div className="flex justify-between items-center p-6 border-b">
            <h3 className="text-xl font-semibold mx-auto">Recent Collections</h3>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => navigate('/collectionHistory')} // Navigate to collectionHistory page
            >
              View All
            </button>
          </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Item Name</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentCollections.map((collection) => (
                    <tr key={collection.id}>
                      <td className="px-6 py-4 text-center">{formatDate(collection.date)}</td>
                      <td className="px-6 py-4 text-center">{collection.category}</td>
                      <td className="px-6 py-4 text-center">{collection.itemName}</td>
                      <td className="px-6 py-4 text-center">{collection.quantity}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          collection.status === 'Collected' ? 'bg-green-100 text-green-800' :
                          collection.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {collection.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h5 className="text-xl font-semibold mb-4">Collected Items by Category</h5>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={130}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h5 className="text-xl font-semibold mb-4">Monthly Collection Frequency</h5>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#8884d8"
                      name="Items Collected"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <ChatButton 
              onClick={toggleChat} 
               isOpen={isChatOpen}
            />
           <ChatDialog 
              isOpen={isChatOpen} 
              onClose={() => setIsChatOpen(false)} 
              userType = "recipient"
           />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
