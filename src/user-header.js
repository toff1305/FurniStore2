import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./user-header.css";
import logo from "./assets/logo.png"; // Using placeholder

export default function UserNavbar() {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // --- STATE ---
  const [userName, setUserName] = useState("User");
  const [menuData, setMenuData] = useState([]); 
  
  // --- STATE FOR LOGOUT MODAL ---
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // --- STATE FOR CASCADING SELECTS ---
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [availableTypes, setAvailableTypes] = useState([]);

  // --- Click outside handlers ---
  const handleClickOutside = useCallback((event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);
  
  // --- Data Fetching Effect ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem("userName");
      if (storedName) {
        setUserName(storedName);
      }
    }

    const fetchHeaderData = async () => {
      try {
        const catRes = await fetch("http://localhost:5000/api/categories-and-types");

        if (catRes.ok) {
          const { categories, productTypes } = await catRes.json();
          const catMap = new Map(categories.map(c => [c._id, { name: c.category_name, types: [] }]));
          productTypes.forEach(pt => {
            if (pt.category_id && pt.category_id._id && catMap.has(pt.category_id._id)) {
              catMap.get(pt.category_id._id).types.push(pt.product_type_name);
            }
          });
          setMenuData(Array.from(catMap.values()));
        }
      } catch (err) {
        console.error("Failed to fetch header data:", err);
      }
    };
    
    fetchHeaderData();
  }, []);
  
  // --- Navigation Handler ---
  const handleCategoryScroll = (hash) => {
    navigate(`/shop#${encodeURIComponent(hash)}`);
  };
  
  // --- Handler for Product Type Selection ---
  const handleProductTypeSelection = (e) => {
    const selectedType = e.target.value;
    if (selectedType) {
      const category = menuData.find(cat => cat.types.includes(selectedType));
      
      if (category) {
        const combinedHash = `${category.name}-${selectedType}`; 
        handleCategoryScroll(combinedHash);
      }
    }
  };
  
  // --- Effect to Update Available Types based on Category Selection ---
  useEffect(() => {
    if (selectedCategoryName) {
      const category = menuData.find(cat => cat.name === selectedCategoryName);
      if (category) {
        setAvailableTypes(category.types);
        handleCategoryScroll(selectedCategoryName);
      } else {
        setAvailableTypes([]);
      }
    } else {
      setAvailableTypes([]);
    }
  }, [selectedCategoryName, menuData]);


  // --- LOGOUT HANDLERS ---
  
  // 1. Triggered when clicking "Logout" in dropdown
  const handleLogoutClick = () => {
    setDropdownOpen(false); // Close dropdown
    setShowLogoutConfirm(true); // Open Modal
  };

  // 2. Triggered when clicking "Yes" in modal
  const confirmLogout = () => {
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    
    setShowLogoutConfirm(false);
    navigate("/home"); 
  };

  // 3. Triggered when clicking "No" in modal
  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };
  
  return (
    <>
      <style>{`
        /* --- STYLES FOR THE HEADER (STICKY) --- */
        .shop-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 40px;
          background-color: #ffffff;
          border-bottom: 2px solid #f0f0f0;
          font-family: 'Poppins', sans-serif;
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          z-index: 900;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .shop-logo {
          height: 50px;
          width: auto;
          cursor: pointer;
        }
        
        .shop-welcome {
          margin-left: 350px; 
          font-size: 1.1rem;
          font-weight: 500;
          color: #333;
        }
        
        /* --- SELECT STYLES --- */
        .nav-selects {
            display: flex;
            gap: 15px;
            align-items: center;
        }
        .nav-selects select {
            padding: 8px 12px;
            font-size: 1rem;
            border: 1px solid #ccc;
            border-radius: 6px;
            appearance: none; 
            background-color: #f9f9f9;
            cursor: pointer;
            transition: border-color 0.2s;
            min-width: 150px;
        }
        .nav-selects select:focus {
            outline: none;
            border-color: #4a552b;
        }

        .shop-nav-icons {
          display: flex;
          align-items: center;
          gap: 25px;
        }
        
        .shop-icon {
          font-size: 1.5rem;
          cursor: pointer;
          position: relative;
          color: #333;
        }
        
        .profile-dropdown {
          position: absolute;
          top: 130%; 
          right: 0;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border: 1px solid #eee;
          width: 160px;
          z-index: 10;
          overflow: hidden;
        }
        
        .dropdown-item {
          padding: 12px 18px;
          font-size: 0.95rem;
          color: #333;
          font-weight: 500;
          cursor: pointer;
        }
        
        .dropdown-item:hover {
          background-color: #f5f7fa;
        }
        
        .dropdown-item:first-child {
          border-bottom: 1px solid #f0f0f0;
        }

        /* --- LOGOUT MODAL STYLES --- */
        .logout-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000; /* Higher than header */
        }

        .logout-modal {
          background-color: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
          text-align: center;
          width: 90%;
          max-width: 400px;
          animation: fadeIn 0.2s ease-out;
        }

        .logout-modal h3 {
          margin-top: 0;
          color: #333;
          font-size: 1.5rem;
        }

        .logout-modal p {
          color: #666;
          margin-bottom: 25px;
        }

        .logout-actions {
          display: flex;
          justify-content: center;
          gap: 15px;
        }

        .btn-cancel {
          padding: 10px 20px;
          background-color: #f0f0f0;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: 600;
          color: #333;
          transition: background 0.2s;
        }
        .btn-cancel:hover {
          background-color: #e0e0e0;
        }

        .btn-confirm {
          padding: 10px 20px;
          background-color: #d32f2f;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: 600;
          color: white;
          transition: background 0.2s;
        }
        .btn-confirm:hover {
          background-color: #b71c1c;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <header className="shop-header">
        <div className="header-left">
          <Link to="/shop">
            <img 
              src={logo} 
              alt="Logo" 
              className="shop-logo" 
            />
          </Link>
          
          <div className="nav-selects">
            {/* 1. Category Selection */}
            <select
              value={selectedCategoryName}
              onChange={(e) => setSelectedCategoryName(e.target.value)}
            >
              <option value="">Select Category</option>
              {menuData.map(category => (
                <option key={category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            
            {/* 2. Product Type Selection */}
            <select
              disabled={!selectedCategoryName}
              onChange={handleProductTypeSelection} 
            >
              <option value="">Select Product Type</option>
              {availableTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          
          <div className="shop-welcome">
            <span>{userName}</span>
          </div>
        </div>

        {/* NAV ICONS */}
        <div className="shop-nav-icons">
          <span className="shop-icon" onClick={() => navigate("/cart")} title="Go to Cart">
            🛒
          </span>
          <span className="shop-icon" onClick={() => navigate("/orderss")} title="View Orders">
            📦
          </span>
          <div className="shop-icon" ref={dropdownRef}>
            <span onClick={() => setDropdownOpen(!dropdownOpen)} title="Profile">👤</span>
            {dropdownOpen && (
              <div className="profile-dropdown">
                <div
                  className="dropdown-item"
                  onClick={() => {
                    navigate("/profile");
                    setDropdownOpen(false);
                  }}
                >
                  View Profile
                </div>
                <div
                  className="dropdown-item"
                  onClick={handleLogoutClick}
                >
                  Logout
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* --- LOGOUT CONFIRMATION MODAL --- */}
      {showLogoutConfirm && (
        <div className="logout-overlay" onClick={cancelLogout}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out?</p>
            <div className="logout-actions">
              <button className="btn-cancel" onClick={cancelLogout}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={confirmLogout}>
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}