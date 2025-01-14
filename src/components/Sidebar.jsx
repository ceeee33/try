import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import app from "../firebase";

// Icons
import { FaHome, FaHistory, FaTasks } from "react-icons/fa"; // Add FaTasks
import { MdInventory, MdOutlineViewList, MdOutlineSettings } from "react-icons/md";
import { IoMdNotifications } from "react-icons/io";
import { IoMdQrScanner } from "react-icons/io";
import { TbBulb } from "react-icons/tb";
import { BiSupport } from "react-icons/bi";

const menuConfig = {
  admin: [
    { title: "Dashboard", path: "/adminDashboard", icon: <FaHome /> },
    { title: "Inventory", path: "/inventory", icon: <MdInventory /> },
    { title: "QR Scanner", path: "/qrscanner", icon: <IoMdQrScanner /> },
    { title: "Reports", path: "/reports" },
    {
      title: "Review Application",
      icon: <FaTasks />,
      children: [
        { title: "Student Application", path: "/student-application" },
        { title: "Donor Application", path: "/donor-application" },
      ],
    },
    { title: "Settings", path: "/settings", icon: <MdOutlineSettings /> },
    { title: "Notifications", path: "/notifications", icon: <IoMdNotifications /> },
    { title: "User Support", path: "/admin/chat", icon: <BiSupport />},
    { title: "System Logs", path: "/systemlogs" },
  ],

  student: [
    { title: "Dashboard", path: "/studentDashboard", icon: <FaHome />},
    { title: "Item List", path: "/itemlist" , icon: <MdOutlineViewList />},
    { title: "History", path: "/collectionHistory", icon: <FaHistory /> },
    // { title: "Track Status", path: "/trackStatus" },
    // { title: "Settings", path: "/settings", icon: <MdOutlineSettings/> },
    // { title: "Notifications", path: "/notifications" , icon: <IoMdNotifications/> },
  ],
  donor: [
    { title: "Dashboard", path: "/donorDashboard", icon: <FaHome />},
    { title: "Donation History", path: "/donor/history", icon: <FaHistory /> },
    { title: "Notifications", path: "/notifications", icon: <IoMdNotifications/> },
    // { title: "Track Status", path: "/trackStatus" },
    { title: "Donation Suggestion", path: "/suggestion", icon: < TbBulb/> },
    { title: "Settings", path: "/settings", icon: <MdOutlineSettings/>  },
  ],
};

const Sidebar = ({ userRole }) => {
  const navigate = useNavigate();
  const Menus = menuConfig[userRole] || [];
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const handleMenuClick = (path) => navigate(path);

  const toggleSubMenu = (menuTitle) => {
    setExpandedMenu((prev) => (prev === menuTitle ? null : menuTitle));
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      try {
        const auth = getAuth(app);
        await signOut(auth);
        localStorage.clear();
        navigate("/login");
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
  };

  return (
    <div className={`sidebar bg-dark text-white vh-100 p-3 ${isCollapsed ? "collapsed" : ""}`}>
      <button className="collapse-btn" onClick={toggleSidebar}>
        {isCollapsed ? ">" : "<"}
      </button>
      <div className="mb-4">
        <h5>{userRole.charAt(0).toUpperCase() + userRole.slice(1)} Portal</h5>
      </div>
      <ul className="nav flex-column">
        {Menus.map((menu, index) => (
          <li key={index}>
            <div
              className={`nav-item mb-2 ${menu.children ? "dropdown" : ""}`}
              onClick={() => (menu.children ? toggleSubMenu(menu.title) : handleMenuClick(menu.path))}
            >
              <span className="nav-link text-white d-flex align-items-center">
                <span className="me-2">{menu.icon}</span>
                {!isCollapsed && <span>{menu.title}</span>}
                {menu.children && !isCollapsed && (
                  <span className="ms-auto">{expandedMenu === menu.title ? "-" : "+"}</span>
                )}
              </span>
            </div>
            {menu.children && expandedMenu === menu.title && (
              <ul className="nav flex-column ps-3">
                {menu.children.map((child, childIndex) => (
                  <li
                    key={childIndex}
                    className="nav-item"
                    onClick={() => handleMenuClick(child.path)}
                  >
                    <span className="nav-link text-white">{child.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-auto">
        <button onClick={handleLogout} className="btn btn-danger">
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
