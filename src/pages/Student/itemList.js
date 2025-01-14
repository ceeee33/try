import React, { useState, useEffect, useCallback } from 'react';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import app from '../../firebase';
import Sidebar from '../../components/Sidebar';
import { useLocation, useNavigate } from 'react-router-dom';
import "react-datepicker/dist/react-datepicker.css";

const ItemList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [desiredQuantities, setDesiredQuantities] = useState({});
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');
  const role = location.state?.role || localStorage.getItem('userRole');

  const [filters, setFilters] = useState({
    searchTerm: '',
    category: '',
    status: '',
    dateRange: 'all',
    startDate: null,
    endDate: null
  });

  const categoryColors = {
    "Food": "bg-red-100",
    "Hygiene Products": "bg-blue-100",
    "Daily Supplies": "bg-green-100",
    "School Supplies": "bg-yellow-100"
  };

  const fetchItems = useCallback(async () => {
    try {
      const db = getFirestore(app);
      const userDoc = await getDoc(doc(db, 'users', userId));
      const matricNum = userDoc.data().matric_num;

      const studentsRef = collection(db, 'students');
      const studentQuery = query(studentsRef, where('matricNo', '==', matricNum));
      const studentSnapshot = await getDocs(studentQuery);
      
      if (!studentSnapshot.empty) {
        const studentCampus = studentSnapshot.docs[0].data().campus;
        const inventoryRef = collection(db, 'inventory');
        const inventoryQuery = query(inventoryRef, where('campus', '==', studentCampus));
        const inventorySnapshot = await getDocs(inventoryQuery);
        
        const itemsList = inventorySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setItems(itemsList);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filterItems = useCallback(() => {
    let filtered = [...items];

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.item_name.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower)
      );
    }

    if (filters.category) {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    if (filters.status) {
      filtered = filtered.filter(item => {
        if (filters.status === 'Successful') return item.quantity > 0;
        if (filters.status === 'Unsuccessful') return item.quantity === 0;
        return true; 
      });
    }

    if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.lastUpdated);
        return itemDate >= filters.startDate && itemDate <= filters.endDate;
      });
    }

    return filtered;
  }, [items, filters]);

  const handleQuantityChange = (itemId, value) => {
    setDesiredQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(1, Math.min(value, items.find(item => item.id === itemId)?.quantity || 1)),
    }));
  };

  const handleCollect = async (itemId, currentQuantity) => {
    const itemName = items.find(item => item.id === itemId)?.item_name;
    const category = items.find(item => item.id === itemId)?.category;
    const desiredQuantity = desiredQuantities[itemId] || 1;

    if (desiredQuantity > currentQuantity) {
      alert('Selected quantity exceeds available stock!');
      return;
    }

    try {
      const db = getFirestore(app);
      
      const itemRef = doc(db, 'inventory', itemId);
      await updateDoc(itemRef, {
        quantity: currentQuantity - desiredQuantity
      });

      const historyRef = collection(db, 'collectionHistory');
      await addDoc(historyRef, {
        userId,
        userName,
        itemId,
        itemName,
        category,
        numItem: desiredQuantity,
        collectedAt: serverTimestamp(),
        status: "Ready to collect"
      });

      alert('Item collected successfully!');
      fetchItems();
      navigate('/collectionHistory');
    } catch (error) {
      console.error('Error collecting item:', error);
      alert('Failed to collect item');
    }
  };

  if (loading) return (
    <div className="ocean">
      <div className="wave"></div>
      <div className="wave"></div>
      <h2>Loading...</h2>
    </div>
  );

  const filteredItems = filterItems();

  return (
    <div className="dashboard-layout">
      <Sidebar userRole={role} />
      <div className="dashboard-content">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Available Items</h1>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by category, item name..."
                  className="rounded-md border-gray-300 w-full pl-10"
                  value={filters.searchTerm}
                  onChange={(e) => setFilters((prev) => ({
                    ...prev,
                    searchTerm: e.target.value,
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
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, category: e.target.value }))
                }
                className="rounded-md border-gray-300"
              >
                <option value="">All Categories</option>
                {Object.keys(categoryColors).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="rounded-md border-gray-300"
              >
                <option value="">All Statuses</option>
                <option value="Successful">In Stock</option>
                <option value="Unsuccessful">Out of Stock</option>
              </select>
            </div>
          </div>


          {/* Items Table */}
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
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredItems.map(item => (
                  <tr key={item.id}>
                    <td>
                      {item.item_name}
                    </td>
                    <td>
      
                        {item.category}
       
                    </td>
                    <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                      {item.quantity > 0 ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            max={item.quantity}
                            value={desiredQuantities[item.id] || 1}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                            className="w-20 rounded-md border-gray-300"
                          />
                          <button
                            onClick={() => handleCollect(item.id, item.quantity)}
                            disabled={desiredQuantities[item.id] > item.quantity}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400"
                          >
                            Collect
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500">Out of Stock</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-gray-600">
            Don't have the item you want?{' '}
            <span
              className="text-blue-600 underline cursor-pointer hover:text-blue-800"
              onClick={() => navigate('/requestform')}
            >
              Click here to request
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ItemList;