import React, { useState, useEffect } from "react";
import "./admin.css"; 
import Topbar from "./topbar-admin"; 
import logo from './assets/logo.png';

// --- Fading Notification Component ---
const FadingNotification = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 500); 
      }, 3000); 

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [message, onClose]);

  if (!isVisible) return null;

  const style = {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 25px',
    borderRadius: '8px',
    color: '#fff',
    backgroundColor: type === 'success' ? '#4CAF50' : '#f44336', 
    zIndex: 2000,
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 0.5s ease-in-out',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    fontFamily: 'Poppins, sans-serif'
  };

  return <div style={style}>{message}</div>;
};

// --- Confirmation Modal Component ---
const ConfirmationModal = ({ isOpen, title, message, onCancel, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p className="confirmation-message">{message}</p>
        <div className="modal-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="confirm-order-btn" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

function Admin() {
  function shortenOrderId(id) {
    return id ? id.slice(-6).toUpperCase() : "";
  }

  // --- STATE ---
  const [allOrders, setAllOrders] = useState([]); 
  const [orders, setOrders] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [customerCount, setCustomerCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  // --- FILTERING ---
  const [searchQuery, setSearchQuery] = useState(""); 
  const [statusFilter, setStatusFilter] = useState(""); 

  // --- NOTIFICATION & MODAL ---
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };
  const handleCloseNotification = () => {
    setNotification({ message: '', type: '' });
  };

  const showConfirmation = (title, message, onConfirm) => {
    setConfirmation({ isOpen: true, title, message, onConfirm });
  };
  const handleCloseConfirmation = () => {
    setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  };
  const handleConfirm = () => {
    confirmation.onConfirm();
    handleCloseConfirmation();
  };

  const statusOptions = ["To Receive", "Completed", "To Ship", "Pending"];

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");

        const [ordersRes, customersRes, productsRes] = await Promise.all([
          fetch("http://localhost:5000/api/order-details", {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
          }),
          fetch("http://localhost:5000/api/stats/total-customers", {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
          }),
          fetch("http://localhost:5000/api/stats/total-products", {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
          }),
        ]);

        if (!ordersRes.ok || !customersRes.ok || !productsRes.ok) {
          throw new Error("Data could not be fetched! Are you logged in as an admin?");
        }

        const ordersData = await ordersRes.json();
        const customersData = await customersRes.json();
        const productsData = await productsRes.json();

        setAllOrders(ordersData);
        setCustomerCount(customersData.totalCustomers);
        setProductCount(productsData.totalProducts);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- FILTERING EFFECT ---
  useEffect(() => {
    let filteredData = [...allOrders];

    if (statusFilter) {
      filteredData = filteredData.filter(
        (order) => order.status === statusFilter
      );
    }

    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filteredData = filteredData.filter(
        (order) =>
          order.orderId.toLowerCase().includes(lowerCaseQuery) ||
          order.userId.toLowerCase().includes(lowerCaseQuery) ||
          order.productName.toLowerCase().includes(lowerCaseQuery)
      );
    }

    setOrders(filteredData); 
  }, [searchQuery, statusFilter, allOrders]);

  // --- HANDLERS ---
  const toggleDropdown = (key) => {
    setDropdownOpen(dropdownOpen === key ? null : key);
  };

  const sortTable = (key, direction) => {
    const keyMap = {
      OrderId: "orderId",
      UserId: "userId",
      "Product Name": "productName",
      OrderDate: "orderDate",
    };

    const sortKey = keyMap[key];
    const sortedOrders = [...orders].sort((a, b) => {
      const valA = a[sortKey]?.toString().toLowerCase() || "";
      const valB = b[sortKey]?.toString().toLowerCase() || "";
      if (valA < valB) return direction === "ascending" ? -1 : 1;
      if (valA > valB) return direction === "ascending" ? 1 : -1;
      return 0;
    });

    setOrders(sortedOrders); 
    setDropdownOpen(null);
  };

  const filterStatus = (status) => {
    setStatusFilter(status); 
    setDropdownOpen(null);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handlePrint = () => {
    window.print();
  };

  const rowsToDisplay =
    orders.length < 5 ? [...orders, ...Array(5 - orders.length).fill(null)] : orders;

  const today = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="admin-page">
      <FadingNotification
        message={notification.message}
        type={notification.type}
        onClose={handleCloseNotification}
      />
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        onCancel={handleCloseConfirmation}
        onConfirm={handleConfirm}
      />

      {/* --- STYLES --- */}
      <style>
        {`
          /* --- STAT CARDS --- */
          .stats-cards {
            display: flex;
            flex-wrap: wrap; 
            gap: 20px; 
            margin-bottom: 30px; 
          }
          .stats-cards .card {
            flex: 1; 
            min-width: 200px; 
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
            text-align: center;
          }
          .stats-cards .card h1 {
            font-size: 2.2rem;
            font-weight: 700;
            margin: 0 0 5px 0;
          }
          .stats-cards .card p {
            font-size: 1rem;
            color: #555;
            margin: 0;
          }
          
          /* --- LOGO --- */
          .logo-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px; 
          }
          .logo-image {
            width: 80px;
            height: 80px;
            object-fit: cover;
            border-radius: 50%;
          }
          .logo-text {
            margin: 0;
            font-size: 25px !important; 
            font-weight: 600;
            text-align: center;
          }

          /* --- TABLE SCROLL WRAPPER (NEW) --- */
          .table-wrapper {
            max-height: 450px; /* Adjust height here */
            overflow-y: auto;  /* Enables scroll */
            border: 1px solid #ddd;
            border-radius: 6px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            margin-bottom: 20px;
          }
          
          /* Custom Scrollbar */
          .table-wrapper::-webkit-scrollbar { width: 8px; }
          .table-wrapper::-webkit-scrollbar-track { background: #f1f1f1; }
          .table-wrapper::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
          .table-wrapper::-webkit-scrollbar-thumb:hover { background: #555; }

          /* --- STICKY HEADER (DARK THEME) --- */
          .orders-table th {
            position: sticky;       /* Makes it sticky */
            top: 0;                 /* Sticks to top of wrapper */
            background-color: #333; /* Dark background to match image */
            color: white;           /* White text */
            z-index: 100;           /* High z-index to stay above rows */
            box-shadow: 0 2px 2px -1px rgba(0,0,0,0.2);
            padding: 12px;          /* Ensure padding matches design */
          }

          /* Fix for Dropdown Z-Index */
          .sort-dropdown {
            z-index: 101; /* Must be higher than th z-index */
            background-color: #2c3e50; /* Match dark dropdown style */
            color: white;
            border: 1px solid #444;
          }
          .sort-dropdown div:hover {
            background-color: #3a4255;
          }

          /* --- PRINT CONTROLS --- */
          .print-controls-dashboard {
            display: flex;
            justify-content: flex-end; 
            margin-top: 20px;
          }
          .print-btn-dashboard {
            padding: 10px 20px;
            font-size: 0.9rem;
            background-color: #333;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          .print-btn-dashboard:hover {
            background-color: #555;
          }

          /* --- PRINT MEDIA QUERY --- */
          @media print {
            body * { visibility: hidden; }
            #printableArea, #printableArea * { visibility: visible; }
            #printableArea { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
            #print-header { visibility: visible; display: block; text-align: center; margin-bottom: 20px; }
            .sidebar, .main-content .header-mf, .search-container, .stats-cards, .print-section-dashboard, .dropdown-toggle { display: none; }
            
            /* RESET SCROLL FOR PRINT */
            .table-wrapper {
              max-height: none !important;
              overflow: visible !important;
              border: none !important;
              box-shadow: none !important;
            }

            .orders-table { width: 100%; border-collapse: collapse; }
            .orders-table th, .orders-table td { border: 1px solid #000; padding: 8px; text-align: left; }
            
            /* Light header for print to save ink */
            .orders-table th { 
              background-color: #f0f0f0; 
              color: #000;
              position: static; /* No sticky on print */
            }
            
            .dropdown-container span { visibility: visible; }
            .dropdown-container .dropdown-toggle { display: none; }
            .status { color: #000; background-color: transparent; font-weight: bold; }
          }
          
          #print-header { display: none; }
          
          /* --- MODAL STYLES --- */
          .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; }
          .modal-content { background-color: #fff; padding: 30px 40px; border-radius: 12px; width: 90%; max-width: 500px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); max-height: 90vh; overflow-y: auto; }
          .confirmation-modal { max-width: 400px; }
          .confirmation-message { font-size: 1rem; color: #333; line-height: 1.6; margin-bottom: 20px; text-align: center; }
          .modal-content h2 { font-size: 1.8rem; font-weight: 600; color: #333; margin-bottom: 25px; text-align: center; }
          .modal-actions { display: flex; gap: 10px; margin-top: 20px; }
          .cancel-btn, .confirm-order-btn { flex: 1; height: 45px; padding: 12px 0; border: none; border-radius: 25px; font-weight: 700; cursor: pointer; transition: 0.3s; font-size: 15px; }
          .cancel-btn { background-color: #eee; color: #555; border: 1px solid #ccc; }
          .cancel-btn:hover { background-color: #ddd; }
          .confirm-order-btn { background-color: #485168; color: white; }
          .confirm-order-btn:hover { background-color: #3a4255; }
        `}
      </style>
      
      <div className="admin-container">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="logo-section">
            <img src={logo} alt="Company Logo" className="logo-image" />
            <h2 className="logo-text">Nest & Nook</h2>
          </div>

          <nav className="sidebar-nav">
            <a href="/admin" className="active">Dashboard</a>
            <a href="/view-products">View Products</a>
            <a href="/manage-furnitures">Manage Furnitures</a>
            <a href="/manage-orders">Manage Orders</a>
            <a href="/manage-users">Manage Users</a>
          </nav>
        </aside>

        <Topbar />

        {/* MAIN CONTENT */}
        <div className="main-content">
          <div className="header-mf">
            <h1>PERFORMANCE OVERVIEW</h1>
          </div>

          <div className="order-section">
            {/* --- SEARCH CONTAINER --- */}
            <div className="search-container">
              <input
                type="text"
                placeholder="Search by Order ID, Customer, or Product..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <button>🔍</button>
            </div>

            <section className="dashboard-section">
              {/* --- STAT CARDS --- */}
              <div className="stats-cards">
                 <div className="card">
                  <h1>{loading ? "..." : customerCount}</h1>
                  <p>Total Customers</p>
                </div>
                <div className="card">
                  <h1>{loading ? "..." : productCount}</h1>
                  <p>Total Products</p>
                </div>
                <div className="card">
                  <h1>{loading ? "..." : allOrders.length}</h1>
                  <p>Total Orders</p>
                </div>
                <div className="card">
                  <h1>
                    {loading
                      ? "..."
                      : allOrders.filter(
                          (o) => o.status === "Pending" || o.status === "To Ship"
                        ).length}
                  </h1>
                  <p>Pending Orders</p>
                </div>
              </div>

              {/* --- PRINTABLE AREA WRAPPER --- */}
              <div id="printableArea">
              
                {/* --- PRINT-ONLY HEADER --- */}
                <div id="print-header">
                  <h1>Nest & Nook</h1>
                  <h2>Furniture Store</h2>
                  <p>Order Report</p>
                  <p>Date: {today}</p>
                </div>

                <h3>VIEW ALL ORDERS</h3>
                
                {/* --- TABLE WRAPPER FOR SCROLLING --- */}
                <div className="table-wrapper">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        {["OrderId", "UserId", "Product Name", "OrderDate", "Status"].map((col) => (
                          <th key={col}> 
                            <div className="dropdown-container">
                              <span>{col.replace(/([A-Z])/g, " $1")}</span>
                              <div
                                className={`dropdown-toggle ${dropdownOpen === col ? "active" : ""}`}
                                onClick={() => toggleDropdown(col)}
                              >
                                ⇅
                              </div>
                            </div>
                            {dropdownOpen === col && (
                              <div className="sort-dropdown">
                                {col === "Status" ? (
                                  statusOptions.map((status) => (
                                    <div key={status} onClick={() => filterStatus(status)}>
                                      {status}
                                    </div>
                                  ))
                                ) : (
                                  <>
                                    <div onClick={() => sortTable(col, "ascending")}>Ascending</div>
                                    <div onClick={() => sortTable(col, "descending")}>Descending</div>
                                  </>
                                )}
                              </div>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                            Loading data from database...
                          </td>
                        </tr>
                      ) : (
                        rowsToDisplay.map((order, index) =>
                          order ? (
                            <tr key={index}>
                              <td>{shortenOrderId(order.orderId)}</td>
                              <td>{order.userId}</td>
                              <td>{order.productName}</td>
                              <td>{order.orderDate}</td>
                              <td
                                className={`status ${(order.status || "").toLowerCase().replace(" ", "")}`}
                              >
                                {order.status || "N/A"}
                              </td>
                            </tr>
                          ) : (
                            <tr key={`empty-${index}`} className="empty-row">
                              <td colSpan="5"></td>
                            </tr>
                          )
                        )
                      )}
                    </tbody>
                  </table>
                </div> {/* End of table-wrapper */}
                
                {!loading && orders.length === 0 && (
                  <p style={{ textAlign: "center", color: "#777", marginTop: "10px" }}>
                    {allOrders.length > 0
                      ? "No orders found for this filter."
                      : "No orders found in the database."}
                  </p>
                )}
                
              </div> {/* End of printableArea */}


              {/* --- PRINT SECTION --- */}
              <div className="print-section-dashboard">
                <div className="print-controls-dashboard">
                  <button className="print-btn-dashboard" onClick={handlePrint}>
                    🖨️ Print / Save as PDF
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;