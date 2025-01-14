import React, { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import Popup from 'reactjs-popup';
import DatePicker from 'react-datepicker';
import 'reactjs-popup/dist/index.css';
import "react-datepicker/dist/react-datepicker.css";
import app from '../../firebase';
import Sidebar from '../../components/Sidebar';

const CollectionHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('userRole');

  const [filters, setFilters] = useState({
    searchTerm: '',
    category: '',
    status: '',
    dateRange: 'all',
    startDate: null,
    endDate: null
  });

  const categoryColors = {
    "Food": "bg-red-100 text-red-800",
    "Hygiene Products": "bg-blue-100 text-blue-800",
    "Daily Supplies": "bg-green-100 text-green-800",
    "School Supplies": "bg-yellow-100 text-yellow-800"
  };

  useEffect(() => {
    const db = getFirestore(app);
    const historyRef = collection(db, 'collectionHistory');
    const historyQuery = query(historyRef, 
      where('userId', '==', userId),
      orderBy('collectedAt', 'desc')
    );

    const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
      const historyList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setHistory(historyList);
      setLoading(false);
    }, (error) => {
      console.error('Error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // const fetchHistory = async () => {
  //   try {
  //     const db = getFirestore(app);
  //     const historyRef = collection(db, 'collectionHistory');
  //     const historyQuery = query(
  //       historyRef, 
  //       where('userId', '==', userId),
  //       orderBy('collectedAt', 'desc')
  //     );
      
  //     const snapshot = await getDocs(historyQuery);
  //     const historyList = snapshot.docs.map(doc => ({
  //       id: doc.id,
  //       ...doc.data()
  //     }));
      
  //     setHistory(historyList);
  //     setLoading(false);
  //   } catch (error) {
  //     console.error('Error:', error);
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   fetchHistory();
  // }, [userId]);

  const filterHistory = () => {
    let filtered = [...history];

    // Apply search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.itemName?.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    // Apply date range filter
    if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.collectedAt.seconds * 1000);
        return itemDate >= filters.startDate && itemDate <= filters.endDate;
      });
    } else if (filters.dateRange === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.collectedAt.seconds * 1000);
        return itemDate >= thirtyDaysAgo;
      });
    } else if (filters.dateRange === '6months') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.collectedAt.seconds * 1000);
        return itemDate >= sixMonthsAgo;
      });
    }

    return filtered;
  };

  const generateQRData = (item) => {
    return JSON.stringify({
      collectionId: item.id,
      userId: item.userId,
      userName: item.userName,
      itemName: item.itemName,
      category: item.category,
      collectedAt: item.collectedAt
    });
  };

  if (loading) {
    return (
      <div className="ocean">
        <div className="wave"></div>
        <div className="wave"></div>
        <h2>Loading...</h2>
      </div>
    );
  }

  const filteredHistory = filterHistory();

  return (
    <div className="dashboard-layout">
      <Sidebar userRole={role} />
      <div className="dashboard-content">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Your Collection History</h1>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by category, item name..."
                  className="rounded-md border-gray-300 w-full pl-10"
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    searchTerm: e.target.value 
                  }))}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg 
                    className="h-5 w-5 text-gray-400" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
              </div>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="rounded-md border-gray-300"
              >
                <option value="">All Categories</option>
                {Object.keys(categoryColors).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="rounded-md border-gray-300"
              >
                <option value="">All Statuses</option>
                <option value="Ready to collect">Ready to Collect</option>
                <option value="Collected">Collected</option>
                <option value="Pending">Pending</option>
              </select>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="rounded-md border-gray-300"
              >
                <option value="all">All Time</option>
                <option value="30days">Last 30 Days</option>
                <option value="6months">Last 6 Months</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {filters.dateRange === 'custom' && (
              <div className="mt-4 flex gap-4">
                <DatePicker
                  selected={filters.startDate}
                  onChange={date => setFilters(prev => ({ ...prev, startDate: date }))}
                  placeholderText="Start Date"
                  className="rounded-md border-gray-300"
                />
                <DatePicker
                  selected={filters.endDate}
                  onChange={date => setFilters(prev => ({ ...prev, endDate: date }))}
                  placeholderText="End Date"
                  className="rounded-md border-gray-300"
                />
              </div>
            )}
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>
                    Item Name
                  </th>
                  <th>
                    Category
                  </th>
                  <th>
                    Quantity
                  </th>
                  <th>
                    Date
                  </th>
                  <th>
                    Status
                  </th>
                  <th>
                    QR Code
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredHistory.map(item => (
                  <tr key={item.id}>
                    <td>
                      {item.itemName}
                    </td>
                    <td>
                        {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                      {item.numItem}
                    </td>
                    <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                      {item.collectedAt?.seconds ? new Date(item.collectedAt.seconds * 1000).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.status === 'Collected' ? 'bg-green-100 text-green-800' :
                        item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                      {item.status === 'Ready to collect' && (
                        <Popup
                          trigger={
                            <span className="text-blue-600 underline cursor-pointer">
                              Show QR Code
                            </span>
                          }
                          modal
                          nested
                        >
                          {close => (
                            <div className="relative p-6">
                              <button
                                onClick={close}
                                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                              >
                                &times;
                              </button>
                              <div className="flex flex-col items-center">
                                <h2 className="text-xl font-bold mb-4">Collection QR Code</h2>
                                <QRCodeSVG 
                                  value={generateQRData(item)}
                                  size={200}
                                  level="H"
                                />
                                <div className="mt-4 text-center">
                                  <p className="font-semibold">{item.itemName} x {item.numItem}</p>
                                  <p className="text-gray-600">{item.category}</p>

                                </div>
                              </div>
                            </div>
                          )}
                        </Popup>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionHistory;