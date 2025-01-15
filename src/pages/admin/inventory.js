import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from '../../components/Sidebar';
import { getDoc, getFirestore } from 'firebase/firestore';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import app from '../../firebase';
import "./admin.css";

//For icons
import { FaSearch } from "react-icons/fa";
import { FaFilter } from "react-icons/fa6";

const Inventory = () =>{
    const location = useLocation();
    const role = location.state?.role || localStorage.getItem('userRole');
    // const name = location.state?.name || localStorage.getItem('userName');

    // State to track whether to show all items or only items with quantity > 0
    const [showAllItems, setShowAllItems] = useState(false);

    // For inventory
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredInv, setFilteredInv] = useState([]);
    const [filterOpen, openFilterModal] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState({
        campus: [],
        stock_level: [],
        category: [],
      });  
    
    // For add items
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filteredCat, setfilteredCat] = useState(items);
    const [createModal, openCreateModal] = useState(false);
    const [newItem, setNewItem] = useState({
        item_name: "",
        category: "",
        campus: "",
        expiry_date: "",
        expiry_date_list: [],
        stock_level: "",
        low_threshold: "",
        high_threshold: "",
        quantity: "",
        unit: "",
    });

    // For remove item
    const [removeOpen, openRemoveModal] = useState(false);
    const [selectedItemID, setSelectedItemID] = useState(null);

    const campuses = ["Main", "Engineering", "Health"];
    const categories = ["Food", "Hygiene Products", "Daily Supplies", "School Supplies"];
    const stocklevels = ["High", "Medium", "Low"];
    
    //Database
    const db = getFirestore(app);

    // Fetch data from firestore
    const fetchInventory = async () => {
        const snapshot = await getDocs(collection(db, "inventory"));
        const fetchedItems = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));             
        setItems(fetchedItems);
        setFilteredInv(showAllItems ? fetchedItems : fetchedItems.filter((item) => item.quantity > 0));
        setLoading(false);
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    // Handle input change (search bar)
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        filterItems(e.target.value);
    };

    // Filter items based on search term
    const filterItems = (term) => {
        if (term === '') {
            setFilteredInv(showAllItems ? items : items.filter((item) => item.quantity > 0));
        } else {
            const lowercasedTerm = term.toLowerCase();
            const filtered = filteredInv.filter(item =>
                item.item_name.toLowerCase().includes(lowercasedTerm) ||
                item.category.toLowerCase().includes(lowercasedTerm) ||
                item.campus.toLowerCase().includes(lowercasedTerm)
            );
            setFilteredInv(filtered);
        }
    };

    // Handle filter change
    const handleFilterChange = (e, category) => {
        // console.log(category);
        const value = e.target.value;
        console.log(`Value: ${value}, Category: ${category}`);

        // setSelectedFilters(prevFilters => {
            const updatedFilters = { ...selectedFilters };
            setSelectedFilters({
                campus: [],
                category: [],
                stock_level: [],
            })
            if (updatedFilters[category].includes(value)) {
                updatedFilters[category] = updatedFilters[category].filter((item) => item !== value);
                console.log("Remove new Filters:", updatedFilters);
            } else {
                updatedFilters[category].push(value);
                console.log("Include New Filters:",updatedFilters);
            }
            setSelectedFilters(updatedFilters);    
    };

    // Apply filters to the inventory data
    const applyFilters = () => {
        let filtered = showAllItems ? items : items.filter((item) => item.quantity > 0);
        console.log("Current Filter: ", selectedFilters);

        if (selectedFilters.campus.length > 0) {
        filtered = filtered.filter((item) => selectedFilters.campus.includes(item.campus));
        }
        if (selectedFilters.stock_level.length > 0) {
        filtered = filtered.filter((item) =>
            selectedFilters.stock_level.includes(item.stock_level)
        );
        }
        if (selectedFilters.category.length > 0) {
        filtered = filtered.filter((item) => selectedFilters.category.includes(item.category));
        }

        setFilteredInv(filtered);

        openFilterModal(false);  // Close modal after applying filters
    };

    // Toggle showing all items
    const handleShowAllItems = () => {
        setShowAllItems((prev) => {
            const newShowAll = !prev;  // Toggle showAllItems state
            setFilteredInv(newShowAll ? items : items.filter((item) => item.quantity > 0)); 
            return newShowAll;
        });
    };

    //Open add button
    const openAddModal = () => {
        setIsModalOpen(true); 
        setfilteredCat(items);
    }

    // Filter item
    const filterItemsByCategory = (category) => {
        if(category === ""){
            const uniqueNames = [...new Set(items.map(item => item.item_name))];
            setfilteredCat(uniqueNames);
        } else {
            const filtered = items
            .filter(item => item.category === category)
            .filter((item, index, self) => 
                index === self.findIndex(t => t.item_name === item.item_name)
            );
            setfilteredCat(filtered);
        }
    };

    const setCategory = (name) => {
        // if (newItem.category === ""){
            const selectedItem = items.find(item => item.item_name === name);
            if (selectedItem) {
                setNewItem((prevState) => ({
                    ...prevState,
                    item_name: selectedItem.item_name,
                    category: selectedItem.category,
                    unit: selectedItem.unit,
                }));
            } else {
                setNewItem((prevState) => ({
                    ...prevState,
                    category: "",
                    unit: "",
                }));
            // }
        }
    }
    

    //Set stock level
    const setStockLevel = (quan, low, high) => {
        let stock_level = ""; 

        console.log("Quantity:", quan, low, high);

        if (quan <= low) {
            stock_level = "Low"
        } else if (quan >= high) {
            stock_level = "High"
        } else {
            stock_level = "Medium"
        }

        console.log("Stock level:", stock_level);

        return stock_level;
    }

    // Submit add item
    const handleAddItem = async () => {
        console.log("Add item function");

        try {
            newItem.quantity = Number(newItem.quantity);
            newItem.low_threshold = Number(newItem.low_threshold);
            newItem.high_threshold = Number(newItem.high_threshold);

            if (newItem.category === "Food") {

                const qfood1 = query(
                    collection(db, "inventory"),
                    where("item_name", "==", newItem.item_name),
                    where("campus", "==", newItem.campus),
                    where("category", "==", "Food")
                  );

                const qfood2 = query(
                    collection(db, "inventory"),
                    where("item_name", "==", newItem.item_name),
                    where("campus", "!=", newItem.campus),
                    where("category", "==", "Food")
                )

                const queryFood1 = await getDocs(qfood1);
                const queryFood2 = await getDocs(qfood2);

                // For same item in same campus
                if (!queryFood1.empty) {
                queryFood1.forEach(async (doc) => {
                    const data = doc.data();

                    console.log(data.expiry_date);
                    console.log(newItem.expiry_date);

                    const exist = data.expiry_date_list?.find(
                        (detail) => detail.expiry_date === newItem.expiry_date
                    );

                    if (exist) {
                        exist.stock += newItem.quantity;
                    } else {
                        data.expiry_date_list.push({
                            expiry_date: newItem.expiry_date,
                            stock: newItem.quantity
                        })
                    }

                    const newQuantity = data.quantity + newItem.quantity;
                    const stockLevel = setStockLevel(newQuantity, data.low_threshold, data.high_threshold);
                    await updateDoc(doc.ref, {
                        quantity: newQuantity,
                        stock_level: stockLevel,
                        expiry_date_list: data.expiry_date_list,
                    });
                    console.log("Updated data!");

                });

                // Handle case where item is not found in that campus
                } else if(!queryFood2.empty) {
                    const data = queryFood2.docs[0].data();

                    const stockLevel = setStockLevel(newItem.quantity, data.low_threshold, data.high_threshold);
                    await addDoc(collection(db, "inventory"), {
                           ...newItem,
                           low_threshold: data.low_threshold,  // Use existing low_threshold
                           high_threshold: data.high_threshold, // Use existing high_threshold
                           unit: data.unit,
                           stock_level: stockLevel,
                           expiry_date_list: [{
                            expiry_date: newItem.expiry_date,
                            stock: newItem.quantity
                        }]
                    });
            
                    console.log("New batch added successfully.");
                } else {
                    const stockLevel = setStockLevel(newItem.quantity, newItem.low_threshold, newItem.high_threshold);
                    await addDoc(collection(db, "inventory"), {
                        ...newItem,
                        stock_level: stockLevel,
                        expiry_date_list: [{
                            expiry_date: newItem.expiry_date,
                            stock: newItem.quantity
                        }]
                    });
                }

            } else {

            //Check if item already exists in that campus
            const q1 = query(
                collection(db, "inventory"),
                where("item_name", "==", newItem.item_name),
                where("campus", "==", newItem.campus)
            );
            const query1 = await getDocs(q1);

            //Check if item already exists but not in that campus
            const q2 = query(
                collection(db, "inventory"),
                where("item_name", "==", newItem.item_name),
                where("campus", "!=", newItem.campus)
            );
            const query2 = await getDocs(q2);

            if (!query1.empty) {
                const itemDoc = query1.docs[0];
                const itemRef = doc(db, "inventory", itemDoc.id);

                const ref = await getDoc(itemRef);

                const data = ref.data();

                const newQuantity = data.quantity + newItem.quantity;
                const stockLevel = setStockLevel(newQuantity, data.low_threshold, data.high_threshold);
                
                await updateDoc(itemRef, {
                    ...newItem,
                    quantity: newQuantity,
                    stock_level: stockLevel,
                });

                console.log("Item updated successfully.");
            
            } else if (!query2.empty){
                const itemDoc = query2.docs[0];
                const itemRef = doc(db, "inventory", itemDoc.id);

                const ref = await getDoc(itemRef);

                const data = ref.data();
                
                // const data = itemDoc.data();
                const stockLevel = setStockLevel(newItem.quantity, data.low_threshold, data.high_threshold);

                await addDoc(collection(db, "inventory"), {
                    ...newItem,
                    low_threshold: data.low_threshold,  // Use existing low_threshold
                    high_threshold: data.high_threshold, // Use existing high_threshold
                    unit: data.unit,
                    stock_level: stockLevel,
                });

                console.log("Item updated2 successfully.");
            } else {
                    const stockLevel = setStockLevel(newItem.quantity, newItem.low_threshold, newItem.high_threshold);
                await addDoc(collection(db, "inventory"), {
                    ...newItem,
                    stock_level: stockLevel,
                });
            }
        }

            fetchInventory();
            setIsModalOpen(false); // Close modal after submission
            openCreateModal(false);
            setNewItem ({
                item_name: "",
                category: "",
                campus: "",
                expiry_date: "",
                stock_level: "",
                low_threshold: "",
                high_threshold: "",
                quantity: 0,
                unit: "",
            });
        } catch (error) {
            console.error("Error adding item: ", error);
        }
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewItem((prevItem) => {
            const updatedItem = { ...prevItem, [name]: value };
            return updatedItem;
        });
    };

    // Delete an item
    const handleRemoveModal = (id) => {
        openRemoveModal(true);
        setSelectedItemID(id);
    };

    const deleteItem = async (id) => {
        const itemDoc = doc(db, "inventory", id);
        await deleteDoc(itemDoc);
        fetchInventory();
        openRemoveModal(false);
    };

    return (
        <div className="dashboard-layout">
            <Sidebar userRole={role} />
            <div className="dashboard-content">
                <h1>Inventory List</h1>
                <div className="row">
                <div className="search-bar">
                    <input 
                        className="input-search" 
                        type="text" 
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                    <button className="search-btn" type="submit">
                        {/* <i className="fas fa-search"></i> */}
                        <FaSearch />
                    </button>
                    <button className="filter-btn" onClick={() => openFilterModal(true)}>
                        <FaFilter />
                    </button>
                </div>
                    <button className="add-btn" onClick={openAddModal}>
                        Add New Item
                    </button>
                </div> 
                <label className="checkbox">
                    <input
                        type="checkbox"
                        checked={showAllItems}
                        onChange={handleShowAllItems}
                    />
                    Show All Items (Including No-stock Items)
                </label>
                

                {loading ? (
                    <p>Loading...</p>
                ) : (
                <table>
                    <thead>
                        <tr>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Campus</th>
                        <th>Expiry Date (Latest)</th>
                        <th>Stock Level</th>
                        <th>Quantity</th>
                        <th>Unit</th>
                        <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        { filteredInv.length === 0 ? (
                            <tr>
                                <td colSpan='8'>No results found</td>
                            </tr>
                        ) : (
                        filteredInv.map((item) => (
                        <tr key={item.id}>
                            <td>{item.item_name}</td>
                            <td>{item.category}</td>
                            <td>{item.campus}</td>
                            {/* <td>{item.expiry_date ? item.expiry_date : "-"}</td> */}
                            <td>{item.expiry_date_list && item.expiry_date_list.length > 0 
                                ? new Date(Math.min(...item.expiry_date_list.map(entry => new Date(entry.expiry_date)))).toISOString().slice(0, 10) 
                                : "-"}</td>
                            <td
                                style={{
                                    color:
                                    item.stock_level === "Low"
                                        ? "red"
                                        : item.stock_level === "High"
                                        ? "green"
                                        : "orange",
                                }}
                            >
                            {item.stock_level}
                            </td>
                            <td>{item.quantity}</td>
                            <td>{item.unit}</td>
                            <td>
                                <button onClick={() => handleRemoveModal(item.id)}>Remove</button>
                            </td>
                        </tr>
                        ))
                    )}
                    </tbody>

                    {isModalOpen && (
                        <div className="model">
                            <h3>Add New Item</h3>
                            <form>
                            <div className="label">
                                <label>Category:</label>
                                <select
                                    name="category"
                                    value={newItem.category}                                       
                                    onChange={(e) => {
                                        handleChange(e);
                                        filterItemsByCategory(e.target.value);
                                      }}
                                    required
                                >
                                    <option value="">Select</option>
                                    <option value="Food">Food</option>
                                    <option value="Stationary">Stationary</option>
                                    <option value="Hygiene Products">Hygiene Products</option>
                                    <option value="School Supplies">School Supplies</option>
                                </select>
                            </div>
                            <div className="label">
                                <label>Item Name:</label>
                                <select
                                    type="text"
                                    name="item_name"
                                    value={newItem.item_name}                                       
                                    onChange={(e) => {
                                        handleChange(e);
                                        setCategory(e.target.value);
                                      }}
                                    required
                                >
                                    <option value="">Select</option>
                                    {[...new Set(filteredCat.map(item => item.item_name))].map((item_name, id) => (
                                        <option 
                                            key={id} 
                                            value={item_name}>
                                            {item_name}
                                        </option>
                                    ))}

                                </select>
                            </div>

                            { newItem.category === "Food" && (
                                <div className="label">
                                <label>Expiry Date:</label>
                                <input
                                    type="date"
                                    name="expiry_date"
                                    value={newItem.expiry_date}
                                    onChange={handleChange}
                                />
                            </div>
                            )}

                            <div className="label">
                                <label>Campus:</label>
                                <select
                                    type="text"
                                    name="campus"
                                    value={newItem.campus}                                       
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select</option>
                                    <option value="Main">Main</option>
                                    <option value="Engineering">Engineering</option>
                                    <option value="Health">Health</option>
                                </select>
                            </div> 
                            
                            <div className="label">
                                <label>Quantity:</label>
                                <input
                                    type="number"
                                    name="quantity"
                                    value={newItem.quantity}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="label">
                                <label>Unit:</label>
                                {/* <input
                                    type="text"
                                    name="unit"
                                    value={newItem.unit}
                                    onChange={handleChange}
                                    required
                                    readOnly
                                /> */}
                                <span>{newItem.unit}</span>
                                {/* <span>
                                    {[...new Set(filteredCat.map(item => item.item_name))].map((item_name, id) => (
                                            <option 
                                                key={id} 
                                                value={item_name}>
                                                {item_name}
                                            </option>
                                        ))}
                                </span> */}
                            </div>
                            </form>
                            <div className="form-btn">
                                <button 
                                    type="submit"
                                    onClick={(e) => {
                                    e.preventDefault();
                                    console.log("Submit add");
                                    handleAddItem();
                                }}
                                >Add Item</button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    style={{ marginLeft: "10px" }}
                                >
                                    Cancel
                                </button>
                            </div>
                            <br></br>
                            <div className="form-btn"
                                style={{
                                    flexDirection: "column",
                                }}>
                                <p style={{fontWeight:'bold', marginBottom:"3px"}}>Item not found in list?</p>
                                <button 
                                    type='create'
                                    onClick={() => openCreateModal(true)}
                                >Create New Item
                                </button>
                            </div>
                            
                        </div>
                    )}

                    {createModal && (
                        <div className="model">
                            <h3>Create New Item</h3>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleAddItem();
                                }}
                            >
                            <div className="label">
                                <label>Item Name:</label>
                                <input
                                    type="text"
                                    name="item_name"
                                    value={newItem.item_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="label">
                                <label>Category:</label>
                                <select
                                    name="category"
                                    value={newItem.category}                                       
                                    onChange={(e) => {
                                        handleChange(e);
                                      }}
                                    required
                                >
                                    <option value="">Select</option>
                                    <option value="Food">Food</option>
                                    <option value="Stationary">Stationary</option>
                                    <option value="Hygiene Products">Hygiene Products</option>
                                    <option value="School Supplies">School Supplies</option>
                                </select>
                            </div>
                            <div className="label">
                                <label>Campus:</label>
                                <select
                                    type="text"
                                    name="campus"
                                    value={newItem.campus}                                       
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select</option>
                                    <option value="Main">Main</option>
                                    <option value="Engineering">Engineering</option>
                                    <option value="Health">Health</option>
                                </select>
                            </div>                                
                            <div className="label">
                                <label>Expiry Date:</label>
                                <input
                                    type="date"
                                    name="expiry_date"
                                    value={newItem.expiry_date}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="label">
                                <label>Unit:</label>
                                <input
                                    type="text"
                                    name="unit"
                                    value={newItem.unit}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="label">
                                <label>Low Stock Threshold:</label>
                                <input
                                    type="number"
                                    name="low_threshold"
                                    value={newItem.low_threshold}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="label">
                                <label>High Stock Point:</label>
                                <input
                                    type="number"
                                    name="high_threshold"
                                    value={newItem.high_threshold}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="label">
                                <label>Quantity:</label>
                                <input
                                    type="number"
                                    name="quantity"
                                    value={newItem.quantity}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            
                            <div className="form-btn"style={{ marginTop: "10px" }}>
                                <button 
                                    type="submit"
                                >Create New Item</button>
                                <button
                                    type="button"
                                    onClick={() => openCreateModal(false)}
                                    style={{ marginLeft: "10px" }}
                                >
                                    Cancel
                                </button>
                            </div>
                            </form>
                        </div>
                    )}

                    {filterOpen && (
                        <div className="model">
                            <h3>Filter Inventory</h3>
                            {/* Campus Filter */}
                            <div className="filter-container">
                            <div className="filter-section">
                            <h4>Campus</h4>
                                {campuses.map((campus) => (
                                    <label key={campus}>
                                        <input
                                        type="checkbox"
                                        value= {campus}
                                        checked={selectedFilters.campus.includes(campus)}
                                        onChange={(e) => handleFilterChange(e, "campus")}
                                        />
                                        {campus} Campus
                                    </label>
                                ))}
                            </div>

                            {/* Category Filter */}
                            <div className="filter-section">
                            <h4>Category</h4>
                                {categories.map((category) => (
                                    <label key={category}>
                                        <input
                                        type="checkbox"
                                        value= {category}
                                        checked={selectedFilters.category.includes(category)}
                                        onChange={(e) => handleFilterChange(e, "category")}
                                        />
                                        {category}
                                    </label>
                                ))}
                            </div>

                            {/* Stock Level */}
                            <div className="filter-section">
                            <h4>Stock Level</h4>
                                {stocklevels.map((stocklevel) => (
                                    <label key={stocklevel}>
                                        <input
                                        type="checkbox"
                                        value= {stocklevel}
                                        checked={selectedFilters.stock_level.includes(stocklevel)}
                                        onChange={(e) => handleFilterChange(e, "stock_level")}
                                        />
                                        {stocklevel}
                                    </label>
                                ))}
                            </div>
                            </div>
                                                            
                            {/* Apply Filter Button */}
                            <button className="apply-filters" onClick={applyFilters}>
                                Apply Filters
                            </button>
                            <button className="close-btn" onClick={() => openFilterModal(false)}>
                                Close
                            </button>
                        </div>
                    )}

                    {removeOpen && (
                        <div className="model">
                            <h3>Confirm to remove the item?</h3>
                            <p>The item details will not be recovered anymore</p>
                            <div className="form-btn" >
                                <button
                                    type = "remove"
                                    onClick={() => deleteItem(selectedItemID)}
                                >Remove</button>
                                <button 
                                    type = "button"
                                    onClick={() => openRemoveModal(false)}>Cancel</button>
                            </div>
                        </div>
                    )}

                    {/* Modal Background */}
                    {isModalOpen && (
                        <div 
                            className="model-bck"
                            onClick={() => setIsModalOpen(false)}
                        />
                    )}

                    {filterOpen && (
                        <div 
                            className="model-bck"
                            onClick={() => openFilterModal(false)}
                        />

                    )}

                    {removeOpen && (
                        <div
                            className="model-bck"
                            onClick={() => openRemoveModal(false)}
                        />
                    )}

                    {createModal && (
                        <div 
                            className="modal-bck"
                            onClick={() => openCreateModal(false)}
                        />
                    )}
                    
                </table>
                )}
            </div>
        </div>
    );
};

export default Inventory;
