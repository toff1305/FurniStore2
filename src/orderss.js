import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom"; // Added Link
// import "./profile_user.css"; // This should be commented out or removed
import UserNavbar from "./user-header";

// --- NEW: Fading Notification Component ---
// This will replace simple `alert()` messages
const FadingNotification = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 500); // Wait for fade-out transition
      }, 3000); // 3 seconds visible

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
    backgroundColor: type === 'success' ? '#4CAF50' : '#f44336', // Green/Red
    zIndex: 2000,
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 0.5s ease-in-out',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    fontFamily: 'Poppins, sans-serif'
  };

  return <div style={style}>{message}</div>;
};

// --- NEW: Confirmation Modal Component ---
// This will replace `window.confirm()` prompts
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


function UserDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- State for Data ---
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeStatus, setActiveStatus] = useState("All"); 

  // --- State for all products/reviews (for modal) ---
  const [allProducts, setAllProducts] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [reviewedProductIds, setReviewedProductIds] = useState(new Set());
  const [completedProductIds, setCompletedProductIds] = useState(new Set());

  // --- State for Review Modal ---
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null); 
  const [reviewProduct, setReviewProduct] = useState(null);
  const [reviewProductId, setReviewProductId] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");

  // --- State for Product Detail Modal ---
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalImage, setProductModalImage] = useState("");
  const [productModalReviews, setProductModalReviews] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);

  // --- State for Order Confirmation Modal ---
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [confirmationOrderDetails, setConfirmationOrderDetails] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [confirmationError, setConfirmationError] = useState(""); // --- NEW

  // --- NEW: State for Notifications ---
  const [notification, setNotification] = useState({ message: '', type: '' });
  
  // --- NEW: State for Confirmation Dialog ---
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // --- Get token from localStorage ---
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName"); 

  // --- NEW: Notification Handlers ---
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };
  const handleCloseNotification = () => {
    setNotification({ message: '', type: '' });
  };

  // --- NEW: Confirmation Handlers ---
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


  // --- Helper Functions (Moved inside component) ---
  const formatPrice = (price) => {
    const numericPrice = Number(price) || 0;
    return `₱${numericPrice.toLocaleString()}`;
  };

  const renderStars = (rating, interactive = false, onStarClick = () => {}) => {
    return [...Array(5)].map((_, index) => {
      const ratingValue = index + 1;
      return (
        <span 
          key={ratingValue}
          className={interactive ? (ratingValue <= rating ? 'on interactive' : 'off interactive') : (ratingValue <= rating ? 'on' : 'off')}
          onClick={() => interactive && onStarClick(ratingValue)}
        >
          ★
        </span>
      );
    });
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // --- Data Fetching ---
  const fetchData = async () => {
    if (!userId || !token) {
      navigate("/login"); 
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [ordersRes, productsRes, reviewsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/profile/me/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:5000/api/products`),
        fetch(`http://localhost:5000/api/reviews`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!ordersRes.ok) throw new Error("Failed to fetch your orders.");
      if (!productsRes.ok) throw new Error("Failed to fetch products.");
      
      const ordersData = await ordersRes.json();
      const productsData = await productsRes.json();
      
      let reviewsData = [];
      if (reviewsRes.ok) {
        reviewsData = await reviewsRes.json();
      } else {
        console.warn("Could not fetch all reviews (user may not be admin).");
      }

      setAllOrders(ordersData);
      setFilteredOrders(ordersData); 
      setAllProducts(productsData); 
      setAllReviews(reviewsData); 

      const myReviews = reviewsData.filter(r => r.customerName === userName);
      const reviewedIds = new Set(myReviews.map(r => r.productId));
      setReviewedProductIds(reviewedIds);

      const completedIds = new Set();
      ordersData.forEach(order => {
        if (order.status === 'Completed') {
          order.products.forEach(p => {
            completedIds.add(p.id);
          });
        }
      });
      setCompletedProductIds(completedIds);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (!userId || !token) {
      navigate("/login");
    } else {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, navigate, token]);

  // --- Filtering Effect ---
  useEffect(() => {
    if (activeStatus === "All") {
      setFilteredOrders(allOrders);
    } else {
      setFilteredOrders(allOrders.filter(order => order.status === activeStatus));
    }
  }, [activeStatus, allOrders]);
  
  // --- Review Modal Handlers ---
  const openReviewModal = (order, product = null) => {
    let productToReview;
    if (product) {
      // Came from "Write Review" on product modal
      productToReview = product;
      setReviewOrder(null);
    } else {
      // Came from "Review" on an order
      const firstUnreviewed = order.products.find(p => !reviewedProductIds.has(p.id));
      
      if (!firstUnreviewed) {
        // --- MODIFIED: Replaced alert ---
        showNotification("You have already reviewed all products in this order.", 'error');
        return;
      }
      
      productToReview = allProducts.find(p => p.id === firstUnreviewed.id);
      setReviewOrder(order); 
    }
    
    if (!productToReview) {
      // --- MODIFIED: Replaced alert ---
      showNotification("Error: Product details not found.", 'error');
      return;
    }
    
    setReviewProduct(productToReview); 
    setReviewProductId(productToReview.id); 
    
    const reviews = allReviews.filter(r => r.productId === productToReview.id);
    reviews.sort((a, b) => {
      if (a.customerName === userName) return -1;
      if (b.customerName === userName) return 1;
      return 0;
    });
    setProductModalReviews(reviews); 

    setProductModalImage(productToReview.image_link_1 || productToReview.image_link_2 || 'https://placehold.co/600x400');
    
    const existingReview = reviews.find(r => r.customerName === userName);
    if (existingReview) {
        setReviewRating(existingReview.rating);
        setReviewComment(existingReview.comment);
    } else {
        setReviewRating(0);
        setReviewComment("");
    }
    
    setReviewError("");
    setIsReviewModalOpen(true);
    setIsProductModalOpen(false);
  };
  
  const closeReviewModal = () => setIsReviewModalOpen(false);
  
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError("");
    if (reviewRating === 0) {
      setReviewError("Please select a star rating.");
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/api/reviews", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: reviewProductId,
          customer_id: userId,
          rating: reviewRating,
          comment: reviewComment
        })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to submit review.");
      }
      // --- MODIFIED: Replaced alert ---
      showNotification("Review submitted successfully!", 'success');
      closeReviewModal();
      fetchData();
    } catch(err) {
      setReviewError(err.message);
    }
  };

  // --- Product Modal Handlers ---
  const openProductModal = (productId) => {
    if (!productId) return;
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const fetchReviewsForProduct = async (prodId) => {
      setLoadingModal(true);
      try {
        const res = await fetch(`http://localhost:5000/api/products/${prodId}/reviews`);
        if (!res.ok) throw new Error("Could not load reviews.");
        const data = await res.json();
        
        data.sort((a, b) => {
          if (a.customerName === userName) return -1;
          if (b.customerName === userName) return 1;
          return 0; 
        });
        
        setProductModalReviews(data);
        
        const existingReview = data.find(r => r.customerName === userName);
        if (existingReview) {
          setReviewedProductIds(prev => new Set(prev).add(prodId));
        }

      } catch (err) {
        console.error(err.message);
        setProductModalReviews([]);
      } finally {
        setLoadingModal(false);
      }
    };
    
    fetchReviewsForProduct(productId);
    
    setSelectedProduct(product);
    setProductModalImage(product.image_link_1 || product.image_link_2 || product.image_link_3 || product.image_link_4 || product.image_link_5 || 'https://placehold.co/600x400/f0f0f0/ccc?text=No+Image');
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => setIsProductModalOpen(false);
  
  const getFurnitureImages = (product) => {
    if (!product) return [];
    const images = [
      product.image_link_1,
      product.image_link_2,
      product.image_link_3,
      product.image_link_4,
      product.image_link_5,
    ];
    return images.filter(Boolean);
  };
  
  // --- Order Action Handlers ---
  const handleCancelOrder = (orderId) => {
    // --- MODIFIED: Replaced window.confirm ---
    showConfirmation(
      "Cancel Order",
      "Are you sure you want to cancel this order?",
      async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/orders/${orderId}/cancel`, {
            method: "PUT",
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Failed to cancel order.");
          }
          showNotification("Order cancelled.", 'success');
          fetchData();
        } catch (err) {
          showNotification(err.message, 'error');
        }
      }
    );
  };

  const handleReorder = (orderId) => {
    // --- MODIFIED: Replaced window.confirm ---
    showConfirmation(
      "Reorder",
      "Place this order again?",
      async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/orders/${orderId}/reorder`, {
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Failed to reorder.");
          }
          showNotification("Order has been placed again! It is now in your 'Pending' list.", 'success');
          setActiveStatus("Pending");
          fetchData();
        } catch (err) {
          showNotification(err.message, 'error');
        }
      }
    );
  };

  // --- Single Product "Buy Now" ---
  const handleOrderNow = (product) => {
    setConfirmationOrderDetails({
      product: product,
      total: product.price,
      quantity: 1
    });
    setPaymentMethod("Cash on Delivery"); 
    setIsProductModalOpen(false);
    setIsConfirmationModalOpen(true);
  };

  const closeConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
    setConfirmationOrderDetails(null);
    setConfirmationError(""); // --- NEW
  };
  
  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    setConfirmationError(""); // --- NEW
    if (!confirmationOrderDetails || !userId) return;

    const { product, total } = confirmationOrderDetails;
    
    try {
      const response = await fetch(`http://localhost:5000/api/products/${product.id}/order`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          customer_id: userId,
          payment_method: paymentMethod,
          total_amount: total,
          product_id: product.id, 
          quantity: 1, 
          order_price: product.price
        })
      });
        if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to place order.");
      }
      // --- MODIFIED: Replaced alert ---
      showNotification("Order placed! It is now in your 'Pending' list.", 'success');
      closeConfirmationModal();
      setActiveStatus("Pending");
      fetchData();
    } catch (err) {
        // --- MODIFIED: Replaced alert ---
        setConfirmationError(err.message);
    }
  };
  
  // --- NEW: Add to Cart Handler ---// --- UPDATED: ADD TO CART (Connects to Backend) ---
  const handleAddToCart = async (product) => {
    // 1. Check if user is logged in
    if (!userId) {
      setNotification({ message: "Please log in to add items to your cart.", type: 'error' });
      navigate("/login");
      return;
    }

    try {
      // 2. Send request to server
      const response = await fetch("http://localhost:5000/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Ensure token is sent if route is protected
        },
        body: JSON.stringify({
          customer_id: userId,
          product_id: product.id,
          quantity: 1
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add to cart");
      }

      // 3. Success Notification
      setNotification({ message: `${product.name} added to cart!`, type: 'success' });

      // Optional: If you have a function to refresh the Navbar cart count, call it here
      // updateCartCount(); 

    } catch (err) {
      console.error("Add to cart error:", err);
      setNotification({ message: "Error adding to cart: " + err.message, type: 'error' });
    }
  };
  
  const goBack = () => navigate("/shop");


  return (
    <div className="ud-container">
      {/* --- NEW: Notification and Confirmation components --- */}
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

      {/* --- MODIFIED: Styles are now copied from shop.js --- */}
      <style>{`
        /* --- Global --- */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Poppins', sans-serif;
        }
        .ud-container {
          background-color: #f5f7fa;
          min-height: 100vh;
        }

        /* --- Go Back Button --- */
        .uc-back-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 20px 40px 0;
          cursor: pointer;
        }
        .uc-back-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: #fff;
          border: 1px solid #ddd;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }
        .uc-back-btn:hover {
          background-color: #f0f0f0;
        }
        .uc-back-text {
          font-weight: 500;
          font-size: 1rem;
          color: #333;
        }

        /* --- Main Content --- */
        .ud-main-content {
          padding: 20px 40px;
        }
        
        /* --- Main Grid Layout --- */
        .ud-main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 1200px) {
          .ud-main-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .ud-section-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #fff;
          background-color: #8c7a6b;
          margin: 0;
          padding: 12px 20px;
          border-radius: 8px 8px 0 0;
        }
        
        .ud-grid-item {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 400px;
          max-height: 500px; 
          background-color: #fff;
          border: 1px solid #ddd;
          border-radius: 10px;
          overflow: hidden; 
        }
        
        .ud-grid-item-content {
          padding: 20px;
          overflow-y: auto; 
          flex-grow: 1;
        }
        
        .ud-orders .ud-grid-item-content {
            background-color: #f7f3e8;
        }

        /* --- Order Status Section --- */
        .ud-order-status {
          display: grid;
          grid-template-columns: repeat(3, 1fr); 
          gap: 10px; 
        }
        
        @media (max-width: 500px) {
          .ud-order-status {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        .ud-status-box {
          background-color: #fff;
          border: 1px solid #ccc;
          border-radius: 8px;
          padding: 10px 5px; 
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          border-bottom: 3px solid #ccc;
          font-size: 0.9rem; 
          white-space: nowrap; 
        }
        .ud-status-box:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.05);
        }
        .ud-status-box.active {
          border: 2px solid #08112b;
          border-bottom-width: 3px;
          font-weight: 600;
          color: #08112b;
          box-shadow: 0 4px 8px rgba(0,0,0,0.05);
          background-color: #fff;
        }
        .ud-status-box p {
          font-weight: 500;
          color: #333;
        }

        /* --- Results Section --- */
        .ud-results-list {
          overflow-y: auto; 
          flex-grow: 1;
        }
        
        .ud-placeholder-text {
          color: #777;
          font-style: italic;
          text-align: center;
          padding-top: 50px;
        }
        .ud-order-card {
          border: 1px solid #eee;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
          background-color: #fff; 
        }
        .ud-order-card:nth-child(even) {
          background-color: #f9f9f9; 
        }
        
        .ud-order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .ud-order-id {
          font-weight: 600;
          font-size: 1.1rem;
        }
        .ud-order-status-badge {
          font-weight: 500;
          font-size: 0.9rem;
          padding: 4px 10px;
          border-radius: 20px;
          color: #fff;
        }
        .ud-order-status-badge.Pending { background-color: #ef4444; }
        .ud-order-status-badge.To-Ship { background-color: #f59e0b; }
        .ud-order-status-badge.To-Receive { background-color: #3b82f6; }
        .ud-order-status-badge.Completed { background-color: #10b981; }
        .ud-order-status-badge.Cancelled { background-color: #6b7280; }
        
        .ud-order-body {
          font-size: 0.95rem;
          color: #555;
        }
        .ud-order-body p {
          margin-bottom: 5px;
        }
        
        .ud-order-products-list {
          font-size: 0.95rem;
          color: #555;
        }
        .ud-order-product-item {
          color: #3b82f6;
          text-decoration: underline;
          cursor: pointer;
          display: block;
          margin-bottom: 3px;
        }
        .ud-order-product-item:hover {
          color: #2563eb;
        }
        
        .ud-order-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-start;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #eee;
        }
        /* These .ud-action-btn styles are for the ORDER CARD BUTTONS */
        .ud-action-btn {
          border: none;
          border-radius: 5px;
          padding: 6px 12px;
          font-weight: 500;
          cursor: pointer;
          font-size: 0.85rem;
          background-color: #6b7280;
          color: white;
          display: flex;
          align-items: center;
          gap: 5px; 
          transition: background-color 0.2s;
        }
        .ud-action-btn:hover {
          background-color: #4b5563;
        }
        .ud-action-btn:disabled {
          background-color: #b0b0b0;
          cursor: not-allowed;
        }
        .ud-action-btn span { 
          font-size: 1.1em;
          line-height: 1;
        }

        
        /* --- MODIFIED: ALL MODAL STYLES COPIED AND FIXED --- */
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        /* Base modal content for simple modals */
        .modal-content {
          background-color: #fff;
          padding: 30px 40px;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          max-height: 90vh;
          overflow-y: auto;
        }
        .confirmation-modal {
          max-width: 400px;
        }
        .confirmation-message {
          font-size: 1rem;
          color: #333;
          line-height: 1.6;
          margin-bottom: 20px;
          text-align: center;
        }
        .modal-content h2 {
          font-size: 1.8rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 25px;
          text-align: center;
        }
        .modal-form .form-group {
          margin-bottom: 15px;
        }
        .modal-form label {
          display: block;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 5px;
          color: #555;
        }
        .modal-form input,
        .modal-form textarea,
        .modal-form select {
          width: 100%;
          padding: 10px;
          font-size: 1rem;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-family: 'Poppins', sans-serif;
        }
        .modal-form textarea {
          resize: vertical;
          min-height: 80px;
        }
        .modal-error {
          color: #d9534f;
          font-size: 0.9rem;
          text-align: center;
          margin-top: 10px;
          height: 1.2em;
        }
        .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        .cancel-btn, .save-btn, .submit-review-btn, .confirm-order-btn {
          flex: 1;
          height: 45px;
          padding: 12px 0;
          border: none;
          border-radius: 25px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.3s;
          font-size: 15px;
        }
        .cancel-btn {
          background-color: #eee;
          color: #555;
          border: 1px solid #ccc;
        }
        .cancel-btn:hover {
          background-color: #ddd;
        }
        .save-btn, .submit-review-btn, .confirm-order-btn {
          background-color: #485168;
          color: white;
        }
        .save-btn:hover, .submit-review-btn:hover, .confirm-order-btn:hover {
          background-color: #3a4255;
        }
        
        /* --- Star Rating --- */
        .star-rating {
          display: flex;
          justify-content: center;
          gap: 5px;
          font-size: 2rem;
          margin-bottom: 15px;
        }
        .star-rating span {
          cursor: pointer;
          color: #ccc;
        }
        .star-rating span.interactive:hover,
        .star-rating span.interactive.on:hover ~ span {
          color: #f59e0b;
        }
        .star-rating span.on {
          color: #f59e0b;
        }
        
        /* --- FIX: Increased Specificity for 2-Column Modals --- */
        .modal-overlay .product-modal-content {
          background-color: white;
          border-radius: 12px;
          width: 90%;
          max-width: 1000px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
          padding: 0;
        }

        .modal-overlay .product-modal-content > form {
          display: flex;
          flex-direction: column;
          height: 100%; 
          min-height: 0; 
        }
        
        .modal-overlay .product-modal-body {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 25px;
          padding: 25px;
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
        }
        
        .modal-overlay .modal-gallery {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .modal-overlay .modal-main-image img {
          width: 100%;
          height: 350px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #eee;
        }
        .modal-overlay .modal-thumbnail-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
        }
        .modal-overlay .modal-thumbnail-grid img {
          width: 100%;
          height: 60px;
          object-fit: cover;
          border-radius: 4px;
          cursor: pointer;
          border: 2px solid transparent;
          transition: border-color 0.2s;
        }
        .modal-overlay .modal-thumbnail-grid img:hover {
          border-color: #999;
        }
        .modal-overlay .modal-thumbnail-grid img.active {
          border-color: #3b82f6;
        }
        .modal-overlay .modal-details {
          display: flex;
          flex-direction: column;
          gap: 15px; 
          min-height: 420px;
        }
        .modal-overlay .modal-details h2 {
          font-size: 1.8rem;
          font-weight: 600;
          margin: 0;
          border-bottom: none;
          padding-bottom: 0;
          text-align: left;
        }
        .modal-overlay .modal-details h3 {
          font-size: 1.2rem;
          font-weight: 600;
          margin: 0;
          border-bottom: none;
          padding-bottom: 0;
          text-align: left;
        }
        .modal-overlay .modal-details .price {
          font-size: 1.5rem;
          font-weight: 700;
          color: #3b82f6;
          margin-bottom: 0; 
        }
        .modal-overlay .modal-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 0; 
        }
        .modal-overlay .info-item {
          background-color: #f8f8f8;
          padding: 10px;
          border-radius: 6px;
        }
        .modal-overlay .info-item label {
          display: block;
          font-size: 0.8rem;
          color: #666;
          font-weight: 500;
          margin-bottom: 2px;
        }
        .modal-overlay .info-item span {
          font-size: 1rem;
          font-weight: 600;
        }
        .modal-overlay .modal-description {
          font-size: 0.95rem;
          color: #333;
          line-height: 1.6;
          flex-grow: 1;
          background-color: #f8f8f8; 
          padding: 10px; 
          border-radius: 6px; 
        }
        .modal-overlay .modal-description h3 {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 5px;
            padding-bottom: 0;
            border-bottom: none;
            text-align: left;
        }
        .modal-overlay .modal-reviews {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          min-height: 150px;
        }
        .modal-overlay .modal-reviews h3 {
            margin-bottom: 10px;
            padding-bottom: 0;
            border-bottom: none;
            text-align: left;
        }
        .modal-overlay .reviews-list {
          flex: 1;
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #eee;
          border-radius: 6px;
          padding: 10px;
        }
        .modal-overlay .review-item {
          border-bottom: 1px solid #f0f0f0;
          padding: 10px 0;
        }
        .modal-overlay .review-item-user {
          background-color: #eef2ff;
          border-left: 4px solid #3b82f6;
          padding: 10px;
          margin: 0 -10px;
          border-radius: 4px;
        }
        .modal-overlay .review-item:last-child {
          border-bottom: none;
        }
        .modal-overlay .review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }
        .modal-overlay .review-name {
          font-weight: 600;
          font-size: 0.95rem;
        }
        .modal-overlay .review-rating {
          font-size: 1.1rem;
          color: #f59e0b;
        }
        .modal-overlay .review-comment {
          font-size: 0.9rem;
          color: #444;
        }
        
        .modal-overlay .product-modal-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0;
          border-top: 1px solid #eee;
          padding: 15px 25px;
          background-color: #f9fafb;
          flex-shrink: 0;
        }
        .modal-overlay .product-modal-actions .action-buttons-group {
          display: flex;
          gap: 10px;
        }
        .modal-overlay .close-btn {
          background-color: #485168;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
        }
        
        /* This is the MODAL button, different from the page button */
        .modal-overlay .ud-modal-action-btn {
          border: none;
          border-radius: 5px;
          padding: 12px 12px;
          font-weight: 500;
          cursor: pointer;
          font-size: 0.85rem;
          background-color: #1c1d20ff;
          color: white;
          display: flex;
          align-items: center;
          gap: 5px; 
          transition: background-color 0.2s;
        }
        .modal-overlay .ud-modal-action-btn:hover {
          background-color: #4b5563;
        }
        .modal-overlay .ud-modal-action-btn:disabled {
          background-color: #b0b0b0;
          cursor: not-allowed;
        }
        .modal-overlay .ud-modal-action-btn span { 
          font-size: 1.1em;
          line-height: 1;
        }
        
        /* --- Confirmation Modal (Buy Now) Styles --- */
        .confirmation-receipt {
          background-color: #f9f9f9;
          border-radius: 8px;
          border: 1px solid #eee;
          padding: 15px;
          margin-bottom: 15px;
        }
        .receipt-item {
          display: flex;
          justify-content: space-between;
          font-size: 1rem;
          margin-bottom: 8px;
        }
        .receipt-item strong {
          color: #333;
        }
        .receipt-total {
          border-top: 2px solid #ddd;
          padding-top: 10px;
          margin-top: 10px;
          font-size: 1.2rem;
          font-weight: bold;
        }

        /* --- FIX: Review modal scrolling/layout --- */
        .modal-overlay .product-modal-content > form .modal-details {
          min-height: auto;
        }
        .modal-overlay .product-modal-content > form .modal-reviews {
          flex-grow: 0;
          min-height: auto;
        }
        .modal-overlay .product-modal-content > form .reviews-list {
          flex: 0 1 auto;
          max-height: 150px;
        }
        
        @media (max-width: 900px) {
          .modal-overlay .product-modal-body {
            grid-template-columns: 1fr;
          }
          .modal-overlay .modal-details {
            min-height: auto;
          }
        }
      `}</style>
      <UserNavbar navigate={navigate} />
      <div className="uc-back-wrapper">
        <div className="uc-back-btn" onClick={goBack}>
          &larr;
        </div>
        <span className="uc-back-text">Go Back</span>
      </div>

      {loading ? (
        <p className="ud-placeholder-text">Loading your profile...</p>
      ) : error ? (
        <p className="ud-placeholder-text" style={{color: 'red'}}>{error}</p>
      ) : (
        <>
          {/* MAIN CONTENT */}
          <main className="ud-main-content">
            <div className="ud-main-grid">
              
              <section className="ud-grid-item ud-orders">
                <h2 className="ud-section-title">CHECK ORDERS BY STATUS</h2>
                <div className="ud-grid-item-content">
                  <div className="ud-order-status">
                    <div className={`ud-status-box ${activeStatus === 'All' ? 'active' : ''}`} onClick={() => setActiveStatus("All")}>
                      <p>All ({allOrders.length})</p>
                    </div>
                    <div className={`ud-status-box ${activeStatus === 'Pending' ? 'active' : ''}`} onClick={() => setActiveStatus("Pending")}>
                      <p>Pending</p>
                    </div>
                    <div className={`ud-status-box ${activeStatus === 'To Ship' ? 'active' : ''}`} onClick={() => setActiveStatus("To Ship")}>
                      <p>To Ship</p>
                    </div>
                    <div className={`ud-status-box ${activeStatus === 'To Receive' ? 'active' : ''}`} onClick={() => setActiveStatus("To Receive")}>
                      <p>To Receive</p>
                    </div>
                    <div className={`ud-status-box ${activeStatus === 'Completed' ? 'active' : ''}`} onClick={() => setActiveStatus("Completed")}>
                      <p>Completed</p>
                    </div>
                    <div className={`ud-status-box ${activeStatus === 'Cancelled' ? 'active' : ''}`} onClick={() => setActiveStatus("Cancelled")}>
                      <p>Cancelled</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="ud-grid-item ud-results">
                <h2 className="ud-section-title">RESULTS ({filteredOrders.length})</h2>
                <div className="ud-results-list ud-grid-item-content">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map(order => {
                      const unreviewedProducts = order.products.filter(p => !reviewedProductIds.has(p.id));
                      const allReviewed = unreviewedProducts.length === 0;

                      return (
                        <div className="ud-order-card" key={order.id}>
                          <div className="ud-order-header">
                            <span className="ud-order-id">Order ID: {order.orderId}</span>
                            <span className={`ud-order-status-badge ${order.status.replace(/\s+/g, '-')}`}>{order.status}</span>
                          </div>
                          <div className="ud-order-body">
                            <p><strong>Date:</strong> {formatDate(order.date)}</p>
                            <p><strong>Payment:</strong> {order.payment}</p>
                            <div className="ud-order-products-list">
                              <strong>Items:</strong>
                              {order.products.map(p => (
                                <span 
                                  key={p.id} 
                                  className="ud-order-product-item" 
                                  onClick={() => openProductModal(p.id)}
                                >
                                  {p.quantity}x {p.name} {reviewedProductIds.has(p.id) ? "(Reviewed)" : ""}
                                </span>
                              ))}
                            </div>
                            <p style={{marginTop: '5px'}}><strong>Total:</strong> {formatPrice(order.total)}</p>
                          </div>
                          <div className="ud-order-actions">
                            {(order.status === "Pending" || order.status === "To Ship") && (
                              <button className="ud-action-btn" onClick={() => handleCancelOrder(order.id)}>
                                <span>&#10005;</span> Cancel
                              </button>
                            )}
                            {order.status === "Completed" && (
                              <button 
                                className="ud-action-btn" 
                                onClick={() => openReviewModal(order, null)}
                                disabled={allReviewed}
                              >
                                <span>&#9998;</span> {allReviewed ? "Reviewed" : "Review"}
                              </button>
                            )}
                            {(order.status === "Completed" || order.status === "Cancelled") && (
                              <button className="ud-action-btn" onClick={() => handleReorder(order.id)}>
                                <span>&#8634;</span> Buy Again
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="ud-placeholder-text">No orders found for this status.</p>
                  )}
                </div>
              </section>

            </div>
          </main>
        </>
      )}
      
      {/* --- Review Modal --- */}
      {isReviewModalOpen && reviewProduct && (
        <div className="modal-overlay" onClick={closeReviewModal}>
          <div className="modal-content product-modal-content" onClick={(e) => e.stopPropagation()}>

            <form onSubmit={handleReviewSubmit} className="modal-form">
              <div className="product-modal-body">
                <div className="modal-gallery">
                  <div className="modal-main-image">
                    <img 
                      src={productModalImage} 
                      alt={reviewProduct.name} 
                      onError={(e) => e.target.src = 'https://placehold.co/600x400/f0f0f0/ccc?text=Image+Not+Found'}
                    />
                  </div>
                  <div className="modal-thumbnail-grid">
                    {getFurnitureImages(reviewProduct).map((imgSrc, index) => (
                      <img 
                        key={index}
                        src={imgSrc} 
                        alt={`${reviewProduct.name} thumbnail ${index + 1}`}
                        className={productModalImage === imgSrc ? 'active' : ''}
                        onClick={() => setProductModalImage(imgSrc)}
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    ))}
                  </div>
                </div>
                <div className="modal-details">
                  <h2>Write a Review</h2>
                  <h3>{reviewProduct.name}</h3>
                  
                  {reviewOrder && reviewOrder.products.length > 1 && (
                    <div className="form-group">
                      <label htmlFor="product">Select Product to Review</label>
                      <select 
                        id="product" 
                        name="product"
                        value={reviewProduct.id}
                        onChange={(e) => {
                          const newProd = allProducts.find(p => p.id === e.target.value);
                          setReviewProduct(newProd);
                          setReviewProductId(e.target.value);
                          setProductModalImage(newProd.image_link_1 || 'https://placehold.co/600x400');
                        }}
                      >
                        {reviewOrder.products.map(p => {
                          const productData = allProducts.find(ap => ap.id === p.id);
                          return (
                            <option key={p.id} value={p.id}>{productData?.name || p.id}</option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label>Your Rating</label>
                    <div className="star-rating">
                      {renderStars(reviewRating, true, setReviewRating)}
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="comment">Your Comment</label>
                    <textarea
                      id="comment"
                      name="comment"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your thoughts about the product..."
                      style={{minHeight: '100px'}}
                    />
                  </div>
                  <div className="modal-error">{reviewError}</div>
                  
                  <div className="modal-reviews" style={{minHeight: '100px'}}>
                      <h3>Existing Reviews</h3>
                       <div className="reviews-list" style={{maxHeight: '150px'}}>
                        {loadingModal ? (
                          <p>Loading reviews...</p>
                        ) : productModalReviews.length > 0 ? (
                          productModalReviews.map(review => (
                            <div key={review.id} className={`review-item ${review.customerName === userName ? 'review-item-user' : ''}`}>
                              <div className="review-header">
                                <span className="review-name">{review.customerName} {review.customerName === userName && "(You)"}</span>
                                <span className="review-rating">{renderStars(review.rating)}</span>
                              </div>
                              <p className="review-comment">{review.comment}</p>
                            </div>
                          ))
                        ) : (
                          <p style={{color: '#666', fontSize: '0.9rem'}}>No reviews for this product yet.</p>
                        )}
                       </div>
                  </div>
                </div>
              </div>
              
              <div className="product-modal-actions">
                <button type="button" className="cancel-btn" onClick={closeReviewModal}>Cancel</button>
                <button type="submit" className="submit-review-btn">Submit Review</button>
              </div>

            </form>
          </div>
        </div>
      )}
      
      {/* --- Product Detail Modal --- */}
      {isProductModalOpen && selectedProduct && (
        <div className="modal-overlay" onClick={closeProductModal}>
          <div className="modal-content product-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="product-modal-body">
              <div className="modal-gallery">
                <div className="modal-main-image">
                  <img 
                    src={productModalImage} 
                    alt={selectedProduct.name} 
                    onError={(e) => e.target.src = 'https://placehold.co/600x400/f0f0f0/ccc?text=Image+Not+Found'}
                  />
                </div>
                <div className="modal-thumbnail-grid">
                  {getFurnitureImages(selectedProduct).map((imgSrc, index) => (
                    <img 
                      key={index}
                      src={imgSrc} 
                      alt={`${selectedProduct.name} thumbnail ${index + 1}`}
                      className={productModalImage === imgSrc ? 'active' : ''}
                      onClick={() => setProductModalImage(imgSrc)}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  ))}
                </div>
              </div>
              <div className="modal-details">
                <h2>{selectedProduct.name}</h2>
                <span className="price">{formatPrice(selectedProduct.price)}</span>
                <div className="modal-info-grid">
                  <div className="info-item">
                    <label>Category</label>
                    <span>{selectedProduct.category}</span>
                  </div>
                  <div className="info-item">
                    <label>Type</label>
                    <span>{selectedProduct.type}</span>
                  </div>
                  <div className="info-item">
                    <label>Stock</label>
                    <span>{selectedProduct.stock} units</span>
                  </div>
                  <div className="info-item">
                    <label>Dimensions (L x W x H)</label>
                    <span>
                      {selectedProduct.dimensions?.length || 'N/A'}cm x 
                      {selectedProduct.dimensions?.width || 'N/A'}cm x 
                      {selectedProduct.dimensions?.height || 'N/A'}cm
                    </span>
                  </div>
                </div>
                <div className="modal-description">
                  <h3>Description</h3>
                  <p>
                    {selectedProduct.description || "No description provided."}
                  </p>
                </div>
                <div className="modal-reviews">
                    <h3>Reviews</h3>
                    <div className="reviews-list">
                      {loadingModal ? (
                        <p>Loading reviews...</p>
                      ) : productModalReviews.length > 0 ? (
                        productModalReviews.map(review => (
                          <div key={review.id} className={`review-item ${review.customerName === userName ? 'review-item-user' : ''}`}>
                            <div className="review-header">
                              <span className="review-name">{review.customerName} {review.customerName === userName && "(You)"}</span>
                              <span className="review-rating">{renderStars(review.rating)}</span>
                            </div>
                            <p className="review-comment">{review.comment}</p>
                          </div>
                        ))
                      ) : (
                        <p style={{color: '#666', fontSize: '0.9rem'}}>No reviews for this product yet.</p>
                      )}
                    </div>
                </div>
              </div>
            </div>
            <div className="product-modal-actions">
              <div className="action-buttons-group">
                {/* --- MODIFIED: Renamed class to prevent CSS conflicts --- */}
                <button 
                  className="ud-modal-action-btn"
                  onClick={() => handleAddToCart(selectedProduct)}
                >
                  <span>🛒</span> Add to Cart
                </button>
                
                {(() => {
                  const hasReviewed = reviewedProductIds.has(selectedProduct.id);
                  const canReview = completedProductIds.has(selectedProduct.id);
                  const isDisabled = !canReview || hasReviewed;
                  let title = "Write a review";
                  if (hasReviewed) title = "You have already reviewed this item.";
                  else if (!canReview) title = "You can only review products from a completed order.";

                  return (
                    <button 
                      className="ud-modal-action-btn" 
                      onClick={() => openReviewModal(null, selectedProduct)}
                      disabled={isDisabled}
                      title={title}
                    >
                      <span>&#9998;</span> {hasReviewed ? "Reviewed" : "Write Review"}
                    </button>
                  );
                })()}

                <button className="ud-modal-action-btn" onClick={() => handleOrderNow(selectedProduct)}>
                  <span>&#8634;</span> Order Now
                </button>
              </div>
              <button className="close-btn" onClick={closeProductModal}>Close</button>
            </div>
          </div>
        </div>
      )}
      
      {/* --- Order Confirmation Modal --- */}
      {isConfirmationModalOpen && confirmationOrderDetails && (
        <div className="modal-overlay" onClick={closeConfirmationModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Your Order</h2>
            <form onSubmit={handleConfirmOrder} className="modal-form">
              
              <div className="confirmation-receipt">
                <div className="receipt-item">
                  <span>{confirmationOrderDetails.product.name} (x1)</span>
                  <strong>{formatPrice(confirmationOrderDetails.product.price)}</strong>
                </div>
                <div className="receipt-item receipt-total">
                  <span>Total</span>
                  <strong>{formatPrice(confirmationOrderDetails.total)}</strong>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="paymentMethod">Payment Method</label>
                <select 
                  id="paymentMethod" 
                  name="paymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="Cash on Delivery">Cash on Delivery</option>
                  <option value="GCash">GCash</option>
                  <option value="Credit Card">Credit Card (Mock)</option>
                </select>
              </div>
              
              {/* --- NEW: Error message display --- */}
              <div className="modal-error">{confirmationError}</div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeConfirmationModal}>Cancel</button>
                <button type="submit" className="confirm-order-btn">Confirm Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;