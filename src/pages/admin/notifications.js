import { useState, useEffect } from 'react';
import { useLocation } from "react-router-dom";
import Sidebar from '../../components/Sidebar';
import { getFirestore } from 'firebase/firestore';
import { collection, getDocs, query, where } from "firebase/firestore";
import app from '../../firebase';
import "./admin.css";

const Notifications = () => {
    const location = useLocation();
    const role = location.state?.role || localStorage.getItem('userRole');
    // const name = location.state?.name || localStorage.getItem('userName');

    //Database
    const db = getFirestore(app);

    const [loading, setLoading] = useState(true);
    const [notiList, setNotiList] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const lowStockNoti = async() => {
        try {
            // Create a query to fetch inventory items where category is "Food"
            const q = query(
                collection(db, "inventory"),
                where("stock_level", "==", "Low")
            );
    
            // Execute the query and get the document snapshots
            const querySnapshot = await getDocs(q);

            const notifications = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                notifications.push({
                    type: "Low Stock",
                    item_name: data.item_name,
                    campus: data.campus,
                    title: "Item has Low Stock!",
                    message: `The item "${data.item_name}" is in low stock! May suggest to donors for donation.`
                });
            });

            return notifications;

        } catch (error) {
            console.error("Error fetching food inventory:", error);
            return []; // Return an empty array in case of an error
        }
    }


    const getFoodNoti = async() => {
        try {
            // Create a query to fetch inventory items where category is "Food"
            const foodQuery = query(
                collection(db, "inventory"),
                where("category", "==", "Food")
            );
    
            // Execute the query and get the document snapshots
            const querySnapshot = await getDocs(foodQuery);

            const notifications = [];

            const expiryCheck = querySnapshot.docs.map(doc => {
                const data = doc.data();
                // const itemId = doc.id;
                const expiryDateList = data.expiry_date_list || []; // Default to empty array if no expiry date list

                // Get today's date
                const today = new Date();

                // Check expired and almost expired items
                expiryDateList.forEach(detail => {
                    const expiryDate = new Date(detail.expiry_date); // Convert expiry date to Date object
                    const timeDifference = expiryDate - today;
                    const daysToExpiry = timeDifference / (1000 * 60 * 60 * 24); // Convert the time difference to days

                    // If item is expired
                    if (expiryDate < today) {
                        console.log("Found expired!");
                        notifications.push({
                            type: "Expiry",
                            item_name: data.item_name,
                            campus: data.campus,
                            expiry_date: detail.expiry_date,
                            title:"Item is Expired",
                            message: `The item "${data.item_name}" has expired. Please take action!`
                        });
                        console.log(notifications);
                    }
                    // If item is almost expired (within a certain threshold of days)
                    else if (daysToExpiry <= 7 && daysToExpiry > 0) {
                        notifications.push({
                            type: "Expiry",
                            item_name: data.item_name,
                            campus: data.campus,
                            expiry_date: detail.expiry_date,
                            title: "Expiring Item!",
                            message: `The item "${data.item_name}" is almost expired. Please take action!`
                        });
                        console.log(notifications);
                    }

                });
            });

            // setNotiList(notifications);

            console.log(notifications.length);

            return notifications;
            

        } catch (error) {
            console.error("Error fetching food inventory:", error);
            return []; // Return an empty array in case of an error
        }
    } 

    async function fetchNoti() {
        try {
            const expiryNoti = await getFoodNoti();
            console.log(expiryNoti);
            const lowStock = await lowStockNoti();

            const combined = [
                ...expiryNoti,
                ...lowStock
            ];

            setNotiList(combined);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    }
    
    const handleOpenModal = () => {
        setIsModalOpen(true);
      };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
      };

    useEffect(() => {
        fetchNoti();
    }, []);
  
  return (
    <div className="dashboard-layout">
      <Sidebar userRole={role}/>
      <div className="dashboard-content">
        <h1>Notification Center</h1>
        {loading ? (
            <p>Loading...</p>
        ) : (
            <div>
                {notiList.length > 0 ? (
                    notiList.map((noti, index) => (
                        <div className="flex justify-center">
                        <div className="flex p-4 text-gray-800 text-xl w-3/4 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600" role="alert">
                            <div key={index} class="text-left">
                                <p className="font-medium font-bold"> <strong>{noti.title}</strong></p>
                                <p>{noti.message}</p>


                                <button 
                                    className="noti-btn open" 
                                    onClick={handleOpenModal}
                                >View more details
                                </button>
                            </div>
                        </div>
                        {isModalOpen && (
                            <div className="model">
                                <h3>{noti.title}</h3>
                                <p>{noti.message}</p> <br></br>
                                <p><strong>Item Name:</strong> {noti.item_name}</p>
                                <p><strong>Campus:</strong> {noti.campus}</p>
                                {noti.type === "Expiry" ? (
                                    <p><strong>Expiry Date:</strong> {noti.expiry_date}</p>
                                ) : null }
                                <button 
                                    className="noti-btn close" 
                                    onClick={handleCloseModal}
                                >Close</button>
                            </div>
                        )}

                        {isModalOpen && (
                            <div 
                                className="model-bck"
                                onClick={() => setIsModalOpen(false)}
                            />
                        )}
                    </div>
                    ))
            ) : (
              <p>No notifications available.</p>
            )}
            </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;