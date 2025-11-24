import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "./shop.css";
import UserNavbar from "./user-header";
import img from './assets/livingroom_bg.jfif';
import img1 from './assets/livingroom2_bg.jpg';
import img2 from './assets/bedroom2_bg.webp';
import img3 from './assets/dining.jpg';
import Footer from "./footer";

// --- Single Banner Import ---
import Banner from "./assets/banner.png"; 

// --- Notification Component ---
const FadingNotification = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 500); 
      }, 3000); 

      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const style = {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 25px',
    borderRadius: '8px',
    color: '#fff',
    backgroundColor: type === 'success' ? '#4CAF50' : '#f44336',
    zIndex: 11000, 
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 0.5s ease-in-out',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    fontFamily: 'Poppins, sans-serif'
  };

  return <div style={style}>{message}</div>;
};

// --- Main Shop Component ---
export default function Shop() {
  const navigate = useNavigate();
  const categoryRefs = useRef({});
  const location = useLocation();
  const dropdownRef = useRef(null); 

  // --- State for Data ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [topRatedProducts, setTopRatedProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // --- State for Quick List / Search ---
  const [isQuickListOpen, setIsQuickListOpen] = useState(false);
  const [quickSearchTerm, setQuickSearchTerm] = useState("");
  const [quickSearchSuggestions, setQuickSearchSuggestions] = useState([]);
  const [listScrollDirection, setListScrollDirection] = useState('up'); 
  const [lastScrollY, setLastScrollY] = useState(0);

  // --- State for Modals ---
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalImage, setProductModalImage] = useState("");
  const [productModalReviews, setProductModalReviews] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);
  
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [confirmationOrderDetails, setConfirmationOrderDetails] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [confirmationError, setConfirmationError] = useState("");
  
  const [notification, setNotification] = useState({ message: '', type: '' });

  // --- Get token and user data ---
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName");
  const [reviewedProductIds, setReviewedProductIds] = useState(new Set());

  const handleCloseNotification = () => {
    setNotification({ message: '', type: '' });
  };

  const formatPrice = (price) => {
    const numericPrice = Number(price) || 0;
    return `PHP ${new Intl.NumberFormat('en-US').format(numericPrice)}.00`;
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

  // --- Scroll Tracking for Quick List Button (Smart Hiding) ---
  useEffect(() => {
    const controlListButton = () => {
      if (typeof window !== 'undefined') { 
        const currentScrollY = window.scrollY;
        // Show if scrolling up or at the top
        if (currentScrollY < lastScrollY || currentScrollY < 100) { 
          setListScrollDirection('up'); 
        } else { 
          setListScrollDirection('down'); // Hide if scrolling down
        }
        setLastScrollY(currentScrollY); 
      }
    };

    window.addEventListener('scroll', controlListButton);
    return () => window.removeEventListener('scroll', controlListButton);
  }, [lastScrollY]);


  // --- Quick List Handlers ---
  const toggleQuickList = () => {
    setIsQuickListOpen(prev => !prev);
    setQuickSearchTerm(""); 
    setQuickSearchSuggestions(allProducts); 
  };

  const handleQuickSearchChange = (e) => {
    const value = e.target.value;
    setQuickSearchTerm(value);

    const trimmedValue = value.trim().toLowerCase();

    if (!allProducts || !Array.isArray(allProducts)) return;
    
    if (trimmedValue.length > 0) {
      // Filter based on relevance (name, then category)
      const exactMatch = [];
      const partialNameMatch = [];
      const partialCategoryMatch = [];
      
      allProducts.forEach(product => {
        // FIX: Using 'name' because your backend maps product_name -> name
        const name = (product.name || "").toLowerCase();
        const category = (product.category || "").toLowerCase();
        
        if (name.startsWith(trimmedValue)) {
            exactMatch.push(product);
        } else if (name.includes(trimmedValue)) {
            partialNameMatch.push(product);
        } else if (category.includes(trimmedValue)) {
            partialCategoryMatch.push(product);
        }
      });
      
      // Combine and remove duplicates
      const combined = [...exactMatch, ...partialNameMatch, ...partialCategoryMatch];
      setQuickSearchSuggestions(combined);
    } else {
      setQuickSearchSuggestions(allProducts); // Show all if search is empty
    }
  };

  const handleQuickSearchSelect = (product) => {
    // Opens the Product Modal
    openProductModal(product);
    setIsQuickListOpen(false); 
    setQuickSearchTerm("");
  };

  const handleQuickSearchKey = (e) => {
    // If user presses Enter, select the first suggested product
    if (e.key === 'Enter' && quickSearchSuggestions.length > 0) {
      handleQuickSearchSelect(quickSearchSuggestions[0]);
    }
  };

  // Close when clicking outside the dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && isQuickListOpen) {
        const toggleButton = document.getElementById('quick-list-toggle');
        if (toggleButton && toggleButton.contains(event.target)) return;

        setIsQuickListOpen(false);
        setQuickSearchTerm("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isQuickListOpen]);


  // --- Data Fetching ---
  const fetchShopData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, reviewsRes] = await Promise.all([
        fetch("http://localhost:5000/api/products"),
        fetch("http://localhost:5000/api/reviews", { 
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
        })
      ]);

      if (!productsRes.ok) throw new Error("Failed to fetch products.");
      
      const productsData = await productsRes.json();
      let reviewsData = [];
      if (reviewsRes.ok) reviewsData = await reviewsRes.json();
      
      setAllProducts(productsData);
      setQuickSearchSuggestions(productsData); // Initialize Quick List
      setAllReviews(reviewsData);

      const myReviews = reviewsData.filter(r => r.customerName === userName);
      setReviewedProductIds(new Set(myReviews.map(r => r.productId)));

      // Top Rated
      const productRatings = {};
      for (const review of reviewsData) {
        if (!review.productId) continue;
        if (!productRatings[review.productId]) {
          productRatings[review.productId] = { total: 0, count: 0 };
        }
        productRatings[review.productId].total += review.rating;
        productRatings[review.productId].count++;
      }
      
      const ratedProducts = productsData.map(product => {
        const ratingData = productRatings[product.id];
        return {
          ...product,
          avgRating: ratingData ? ratingData.total / ratingData.count : 0,
          reviewCount: ratingData ? ratingData.count : 0
        };
      }).sort((a, b) => b.avgRating - a.avgRating);

      setTopRatedProducts(ratedProducts.slice(0, 5));

      // Categories
      const categoryMap = new Map();
      for (const product of productsData) {
        if (!product.category || product.category === "N/A") continue;

        if (!categoryMap.has(product.category)) {
          categoryMap.set(product.category, {
            name: product.category,
            types: new Map(),
            image: product.image
          });
        }
        
        const category = categoryMap.get(product.category);
        const typeName = product.type || "Other";
        
        if (!category.types.has(typeName)) {
          category.types.set(typeName, []);
        }
        
        category.types.get(typeName).push(product);
      }
      
      const categoryList = Array.from(categoryMap.values()).map(cat => ({
        ...cat,
        types: Array.from(cat.types.entries()).map(([typeName, products]) => ({
          name: typeName,
          products: products
        }))
      }));

      setCategories(categoryList);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userName, token]);

  useEffect(() => {
    fetchShopData();
  }, [fetchShopData]);

  // --- Effect for auto-scrolling ---
  useEffect(() => {
    if (loading) return; 
    
    if (location.hash) {
      const targetHash = decodeURIComponent(location.hash.substring(1));
      
      let element = categoryRefs.current[targetHash];
      if (!element) {
        element = document.getElementById(targetHash);
      }
      
      if (element) {
        const yOffset = -82; // Offset for fixed navbar
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  }, [location, loading]);

  // --- Modal Handlers ---
  const openProductModal = (product) => {
    const fetchReviewsForProduct = async (productId) => {
      setLoadingModal(true);
      try {
        const res = await fetch(`http://localhost:5000/api/products/${productId}/reviews`);
        if (!res.ok) throw new Error("Could not load reviews.");
        const data = await res.json();
        data.sort((a, b) => {
          if (a.customerName === userName) return -1;
          if (b.customerName === userName) return 1;
          return 0; 
        });
        setProductModalReviews(data);
        if (data.find(r => r.customerName === userName)) {
          setReviewedProductIds(prev => new Set(prev).add(productId));
        }
      } catch (err) {
        setProductModalReviews([]);
      } finally {
        setLoadingModal(false);
      }
    };
    fetchReviewsForProduct(product.id);
    setSelectedProduct(product);
    setProductModalImage(product.image_link_1 || product.image_link_2 || product.image_link_3 || product.image_link_4 || product.image_link_5 || 'https://placehold.co/600x400/f0f0f0/ccc?text=No+Image');
    setIsProductModalOpen(true);
  };
  const closeProductModal = () => setIsProductModalOpen(false);

  const openReviewModal = (product, orderContext = null) => {
    setReviewProduct(product); 
    setReviewOrder(orderContext);
    const existingReview = allReviews.find(r => r.customerName === userName && r.productId === product.id);
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
          product_id: reviewProduct.id,
          customer_id: userId,
          rating: reviewRating,
          comment: reviewComment
        })
      });
      if (!response.ok) throw new Error("Failed to submit review.");
      setNotification({ message: "Review submitted successfully!", type: 'success' });
      closeReviewModal();
      fetchShopData(); 
    } catch(err) {
      setReviewError(err.message);
    }
  };

  const handleOrderNow = (product) => {
    if (!userId) {
        setNotification({ message: "Please log in to place an order.", type: 'error' });
        navigate("/login");
        return;
    }
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
    setConfirmationError("");
  };
  
  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    setConfirmationError("");
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
      if (!response.ok) throw new Error("Failed to place order.");
      setNotification({ message: "Order placed! Check 'To Pending'.", type: 'success' });
      closeConfirmationModal();
    } catch (err) {
        setConfirmationError(err.message);
    }
  };
  
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

// --- UPDATED: ADD TO CART (Connects to Backend) ---
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
  
  const handleCategoryClick = (categoryName) => {
    const element = categoryRefs.current[categoryName];
    if (element) {
      const yOffset = -82;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // --- Sub-Components ---
  const Hero = () => {
    const heroStyle = {
      background: `url(${img}) center/cover no-repeat`,
      height: '40vh',   
      position: 'relative',
      display: 'flex',
      marginTop: '-100px', 
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    };
    return <section className="shop-hero" style={heroStyle}></section>;
  };

  const FeaturedCategories = () => {
    const slides = [
      { name: "Living Room", image: img1 },
      { name: "Bedroom", image: img2 },
      { name: "Dining Room", image: img3 },
    ];
    return (
      <section className="shop-category">
        <h2>SHOP BY CATEGORY</h2>
        <p>Find the perfect furniture for every room, style, and mood in just one click.</p>
        <div className="shop-category-cards">
          {slides.map((slide, idx) => (
            <div 
              className="shop-card" 
              key={idx}
              onClick={() => handleCategoryClick(slide.name)} 
              style={{ cursor: "pointer" }}
            >
              <img
                src={slide.image}
                alt={slide.name}
                onError={(e) => (e.target.src = "https://placehold.co/400x300/f0f0f0/ccc?text=Image+Error")}
              />
              <h3>{slide.name}</h3>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const TopRatedProducts = ({ products = [] }) => {
    return (
      <section className="top-rated-section">
        <h2>OUR MOST-RATED PRODUCTS</h2>
        <p>Discover the pieces our customers love the most.</p>
        <div className="top-rated-grid">
          {products.length > 0 ? (
            products.map((product) => (
              <div className="top-rated-card" key={product.id} onClick={() => openProductModal(product)}>
                <img 
                  src={product.image || 'https://placehold.co/400x300'} 
                  alt={product.name} // FIX: using name
                  onError={(e) => e.target.src = 'https://placehold.co/400x300/f0f0f0/ccc?text=Image+Error'}
                />
                <h4>{product.name}</h4> {/* FIX: using name */}
                <div className="rating">
                  {renderStars(product.avgRating)}
                  <span>({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})</span>
                </div>
                <p className="price">{formatPrice(product.price)}</p>
              </div>
            ))
          ) : (
            <p>No rated products found.</p>
          )}
        </div>
      </section>
    );
  };
  
  // --- Main Return ---
  if (loading) return <div style={{textAlign: 'center', padding: '50px', fontSize: '1.2rem'}}>Loading Shop...</div>;
  
  if (error) return (
      <div style={{ color: 'red', padding: '20px', textAlign: 'center', backgroundColor: '#ffeeee', border: '1px solid red', margin: '20px' }}>
        <strong>Error:</strong> {error}
        <p style={{ margin: '5px 0 0 0' }}>Please ensure your backend server is running on http://localhost:5000.</p>
      </div>
  );

  return (
    <div className="shop-page"><style>{`
  /* === GLOBAL RESET & BASE STYLES === */
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; }
  html { scroll-behavior: smooth; }
  body { width: 100%; overflow-x: hidden; }
  .shop-page { display: flex; flex-direction: column; min-height: 100vh; }
  .header-spacer { height: 82px; }
  .shop-hero { height: 50vh; width: 100%; overflow: hidden; }


  /* --- QUICK LIST ACCESS BUTTON (BURGER ICON) --- */
  .quick-list-access-wrapper {
    position: fixed;
    bottom: 30px;
    right: 30px;
    z-index: 9500; /* High z-index for visibility */
    transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
  }
  .quick-list-access-wrapper.hidden {
    transform: translateY(100px);
    opacity: 0;
    pointer-events: none;
  }

  #quick-list-toggle {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: #485168; /* Dark Blue/Gray */
    color: white;
    border: none;
    cursor: pointer;
    font-size: 1.5rem;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    transition: background-color 0.2s, transform 0.2s;
  }
  #quick-list-toggle:hover {
    background-color: #3a4255;
    transform: scale(1.05);
  }


  /* --- QUICK LIST DROPDOWN PANEL --- */
  .quick-list-panel {
    position: absolute;
    bottom: 70px; /* Position above the button */
    right: 0;
    width: 350px;
    max-height: 450px;
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 9600; /* Higher than wrapper/toggle */
  }
  @media (max-width: 400px) {
    .quick-list-panel {
      width: 90vw;
      right: 5vw;
    }
  }

  .quick-list-header {
    padding: 15px;
    border-bottom: 1px solid #eee;
    font-weight: 600;
    color: #485168;
    text-align: center;
  }

  .quick-list-search input {
    width: 100%;
    padding: 10px 15px;
    border: none;
    border-bottom: 1px solid #ddd;
    outline: none;
    font-size: 1rem;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05) inset;
  }

  .quick-list-items {
    overflow-y: auto;
    flex-grow: 1;
    list-style: none;
    padding: 0;
  }

  .quick-list-item {
    display: flex;
    align-items: center;
    padding: 10px 15px;
    border-bottom: 1px solid #f9f9f9;
    cursor: pointer;
    transition: background-color 0.15s;
    color: #333;
  }
  .quick-list-item:hover, .quick-list-item:focus {
    background-color: #f5f5f5;
  }
  .quick-list-item:first-child {
    background-color: #e6f7ff; /* Highlight nearest match */
    border-left: 3px solid #3b82f6;
    font-weight: 600;
  }
  .quick-list-item:first-child .item-details { color: #3b82f6; }


  .quick-list-item img {
    width: 45px;
    height: 45px;
    object-fit: cover;
    border-radius: 4px;
    margin-right: 15px;
  }
  .item-name { font-weight: 500; font-size: 0.95rem; }
  .item-details { font-size: 0.75rem; color: #888; }


  /* === BANNER CSS (Overlay Styles) === */
  .banner-container {
    position: relative;
    width: 100%;
    overflow: hidden;
    text-align: center;
    border-radius: 8px;
    margin-bottom: 20px;
  }
  .banner-bg {
    width: 100%;
    max-height: 400px;
    object-fit: cover;
    border-radius: 8px;
    display: block;
  }
  .banner-text-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    width: 100%;
    color: #eee7d6; 
    text-shadow: 2px 2px 8px rgba(0,0,0,0.3);
  }
  
  /* Font Placeholders - Ensure you import these fonts in your main CSS file! */
  .banner-script-text {
    font-family: 'Parfumerie Script', 'Brush Script MT', cursive;
    font-size: 5rem; 
    font-weight: 400;
    margin: 0;
    line-height: 1;
  }
  .banner-serif-text {
    font-family: 'Le Jour Serif', 'Times New Roman', serif;
    font-size: 4rem; 
    font-weight: 400;
    margin: -15px 0 0 0; 
    text-transform: uppercase;
    letter-spacing: 5px;
  }

  /* === AREA SECTIONS === */
  .shop-area-section { height: auto; background: #f8f8f8; padding: 20px 0; }
  .shop-overlay { background-color: transparent; padding: 20px 40px; text-align: left; }
  .shop-overlay p { color: #4a2f0c; font-size: 1.5rem; font-weight: 500; max-width: 100%; }

  /* === PRODUCT DISPLAY === */
  .shop-product-display { padding: 20px 40px 60px 40px; background: #f8f8f8; }
  .shop-product-row { 
    margin-bottom: 40px; 
    padding-top: 82px; 
    margin-top: -82px; 
  }
  .shop-product-row h2 { font-size: 2rem; color: #4a2f0c; margin-bottom: 20px; border-bottom: 2px solid #e6dcaa; padding-bottom: 10px; display: flex; align-items: center; gap: 10px; }
  .shop-product-row h2 span { font-size: 1.5rem; }
  .shop-divider { color: #e6dcaa; font-weight: 300; }
  .shop-products { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
  .shop-item { background:#e9e0b9; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden; transition: box-shadow 0.3s; position: relative; display: flex; flex-direction: column; }
  .shop-item:hover { box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
  .shop-item img { width: 100%; height: 220px; object-fit: cover; cursor: pointer; }
  .shop-item .item-info { padding: 15px; flex-grow: 1; }
  .shop-item p { font-size: 1rem; color: #553729ff; line-height: 1.4; }
  .item-name { font-weight: 600; font-size: 1.1rem; }
  .item-price { font-weight: 700; color: #4f51ccff !important; margin: 5px 0; }
  .item-details-link { font-size: 0.9rem; font-style: italic; color: #555; cursor: pointer; text-decoration: underline; }
  .shop-item-btn { display: block; width: calc(100% - 30px); margin: 0 15px 15px; padding: 10px; background-color: #634c40ff !important; color: white !important; border: none; border-radius: 5px; font-weight: 600; cursor: pointer; transition: background-color 0.3s; }
  .shop-item-btn:hover { background-color: #3d342fff !important; }
  .shop-item-btn-add { display: block; width: calc(100% - 30px); margin: 10px 15px 0px; padding: 10px; background-color: #8c7a6b; color: white; border: none; border-radius: 5px; font-weight: 600; cursor: pointer; transition: background-color 0.3s; }
  .shop-item-btn-add:hover { background-color: #7a6c5f; }
  
  /* === TOP RATED === */
  .top-rated-section { text-align: center; padding: 60px 40px; background-color: #f2ecd5; }
  .top-rated-section h2 { font-size: 2.5rem; color: #4a2f0c; margin-bottom: 10px; }
  .top-rated-section p { font-size: 1.1rem; color: #6a4b22; margin-bottom: 40px; }
  .top-rated-grid { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; }
  .top-rated-card { background-color: #fff; width: 250px; border-radius: 14px; padding: 15px; text-align: center; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); transition: transform 0.2s, box-shadow 0.2s; border: 1px solid #eee; cursor: pointer; }
  .top-rated-card:hover { transform: translateY(-5px); box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1); }
  .top-rated-card img { width: 100%; height: 180px; border-radius: 10px; object-fit: cover; margin-bottom: 10px; }
  .top-rated-card h4 { font-size: 1.1rem; font-weight: 600; text-transform: uppercase; margin-bottom: 6px; }
  .top-rated-card .rating { font-size: 1rem; color: #f59e0b; margin-bottom: 6px; display: flex; justify-content: center; align-items: center; gap: 5px; }
  .top-rated-card .rating span { font-size: 0.8rem; color: #666; }
  .top-rated-card .price { font-weight: 700; font-size: 1rem; color: #3b82f6; }
  
  /* === MODAL OVERLAY (HIGHEST Z-INDEX) === */
  .modal-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex; justify-content: center; align-items: center;
    z-index: 10000 !important; 
  }
  .modal-content { background-color: #fff; padding: 30px 40px; border-radius: 12px; width: 90%; max-width: 500px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); max-height: 90vh; overflow-y: auto; }
  .modal-content h2 { font-size: 1.8rem; font-weight: 600; color: #333; margin-bottom: 25px; text-align: center; }
  .modal-form .form-group { margin-bottom: 15px; }
  .modal-form label { display: block; font-size: 0.9rem; font-weight: 500; margin-bottom: 5px; color: #555; }
  .modal-form input, .modal-form textarea, .modal-form select { width: 100%; padding: 10px; font-size: 1rem; border: 1px solid #ccc; border-radius: 6px; font-family: 'Poppins', sans-serif; }
  .modal-form textarea { resize: vertical; min-height: 80px; }
  .modal-error { color: #d9534f; font-size: 0.9rem; text-align: center; margin-top: 10px; height: 1.2em; }
  .modal-actions { display: flex; gap: 10px; margin-top: 20px; }
  .cancel-btn, .save-btn, .submit-review-btn, .confirm-order-btn { flex: 1; height: 45px; padding: 12px 0; border: none; border-radius: 25px; font-weight: 700; cursor: pointer; transition: 0.3s; font-size: 15px; }
  .cancel-btn { background-color: #eee; color: #555; border: 1px solid #ccc; }
  .cancel-btn:hover { background-color: #ddd; }
  .save-btn, .submit-review-btn, .confirm-order-btn { background-color: #485168; color: white; }
  .save-btn:hover, .submit-review-btn:hover, .confirm-order-btn:hover { background-color: #3a4255; }
  .star-rating { display: flex; justify-content: center; gap: 5px; font-size: 2rem; margin-bottom: 15px; }
  .star-rating span { cursor: pointer; color: #ccc; }
  .star-rating span.interactive:hover, .star-rating span.interactive.on:hover ~ span { color: #f59e0b; }
  .star-rating span.on { color: #f59e0b; }
  
  /* Product & Review Modal Layouts */
  .product-modal-content { background-color: white; border-radius: 12px; width: 95% !important; max-width: 1000px !important; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; padding: 0; }
  .product-modal-body { display: grid; grid-template-columns: 400px 1fr !important; gap: 25px; padding: 25px; flex: 1 1 auto; min-height: 0; overflow-y: auto; }
  .modal-gallery { display: flex; flex-direction: column; gap: 10px; }
  .modal-main-image img { width: 100%; height: 350px; object-fit: cover; border-radius: 8px; border: 1px solid #eee; }
  .modal-thumbnail-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
  .modal-thumbnail-grid img { width: 100%; height: 60px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 2px solid transparent; transition: border-color 0.2s; }
  .modal-thumbnail-grid img:hover { border-color: #999; }
  .modal-thumbnail-grid img.active { border-color: #3b82f6; }
  .modal-details { display: flex; flex-direction: column; gap: 15px; min-height: 420px; }
  .modal-details h2 { font-size: 1.8rem; font-weight: 600; margin: 0; border-bottom: none; padding-bottom: 0; text-align: left; }
  .modal-details h3 { font-size: 1.2rem; font-weight: 600; margin: 0; border-bottom: none; padding-bottom: 0; text-align: left; }
  .modal-details .price { font-size: 1.5rem; font-weight: 700; color: #3b82f6; margin-bottom: 0; }
  .modal-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 0; }
  .info-item { background-color: #f8f8f8; padding: 10px; border-radius: 6px; }
  .info-item label { display: block; font-size: 0.8rem; color: #666; font-weight: 500; margin-bottom: 2px; }
  .info-item span { font-size: 1rem; font-weight: 600; }
  .modal-description { font-size: 0.95rem; color: #333; line-height: 1.6; flex-grow: 1; background-color: #f8f8f8; padding: 10px; border-radius: 6px; }
  .modal-description h3 { font-size: 1rem; font-weight: 600; margin-bottom: 5px; padding-bottom: 0; border-bottom: none; text-align: left; }
  .modal-reviews { flex-grow: 1; display: flex; flex-direction: column; min-height: 150px; }
  .modal-reviews h3 { margin-bottom: 10px; padding-bottom: 0; border-bottom: none; text-align: left; }
  .reviews-list { flex: 1; max-height: 200px; overflow-y: auto; border: 1px solid #eee; border-radius: 6px; padding: 10px; }
  .review-item { border-bottom: 1px solid #f0f0f0; padding: 10px 0; }
  .review-item-user { background-color: #eef2ff; border-left: 4px solid #3b82f6; padding: 10px; margin: 0 -10px; border-radius: 4px; }
  .review-item:last-child { border-bottom: none; }
  .review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
  .review-name { font-weight: 600; font-size: 0.95rem; }
/* Container for the stars in the review list */
.review-rating { 
  font-size: 1.1rem; 
  display: inline-flex; /* Ensures stars sit nicely */
}

/* Force the filled stars to be yellow */
.review-rating span.on { 
  color: #f59e0b !important; 
}

/* Force the empty stars to be grey */
.review-rating span.off { 
  color: #ccc !important; 
}
  .review-comment { font-size: 0.9rem; color: #444; }
  .product-modal-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 0; border-top: 1px solid #eee; padding: 15px 25px; background-color: #f9fafb; flex-shrink: 0; }
  .product-modal-actions .action-buttons-group { display: flex; gap: 10px; }
  .close-btn { background-color: #485168; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 500; cursor: pointer; }
  .ud-action-btn { border: none; border-radius: 5px; padding: 12px 12px; font-weight: 500; cursor: pointer; font-size: 0.85rem; background-color: #1c1d20ff; color: white; display: flex; align-items: center; gap: 5px; transition: background-color 0.2s; }
  .ud-action-btn:hover { background-color: #4b5563; }
  .ud-action-btn:disabled { background-color: #b0b0b0; cursor: not-allowed; }
  .ud-action-btn span { font-size: 1.1em; line-height: 1; }
  
  .confirmation-receipt { background-color: #f9f9f8; border-radius: 8px; border: 1px solid #eee; padding: 15px; margin-bottom: 15px; }
  .receipt-item { display: flex; justify-content: space-between; font-size: 1rem; margin-bottom: 8px; }
  .receipt-item strong { color: #333; }
  .receipt-total { border-top: 2px solid #ddd; padding-top: 10px; margin-top: 10px; font-size: 1.2rem; font-weight: bold; }
  
  .product-modal-content > form { display: flex; flex-direction: column; height: 100%; min-height: 0; }
  .product-modal-content > form .modal-details { min-height: auto; }
  .product-modal-content > form .modal-reviews { flex-grow: 0; min-height: auto; }
  .product-modal-content > form .reviews-list { flex: 0 1 auto; max-height: 150px; }
  
  @media (max-width: 900px) {
    .shop-area-section { background-attachment: scroll; }
    .product-modal-body { grid-template-columns: 1fr !important; }
    .modal-details { min-height: auto; }
    .modal-main-image img { height: 250px; }
    
    /* Mobile Adjustments for Banner Text */
    .banner-script-text { font-size: 3rem; }
    .banner-serif-text { font-size: 2.5rem; margin-top: -10px; }
  }
`}</style>
      
      <UserNavbar navigate={navigate} />
      <FadingNotification message={notification.message} type={notification.type} onClose={handleCloseNotification} />
      <div className="header-spacer"></div>
      
      {/* --- QUICK LIST ACCESS BUTTON AND DROPDOWN --- */}
      <div 
        className={`quick-list-access-wrapper ${listScrollDirection === 'down' ? 'hidden' : ''}`}
      >
        {isQuickListOpen && (
          <div className="quick-list-panel" ref={dropdownRef}>
            <div className="quick-list-header">Quick Product Access</div>
            
            <div className="quick-list-search">
              <input 
                type="text" 
                placeholder="Find a product..." 
                value={quickSearchTerm}
                onChange={handleQuickSearchChange}
                onKeyDown={handleQuickSearchKey}
                autoFocus
              />
            </div>
            
            <ul className="quick-list-items">
              {loading ? (
                <li style={{ padding: '10px 15px', color: '#888' }}>Loading products...</li>
              ) : quickSearchSuggestions.length > 0 ? (
                quickSearchSuggestions.map((product, index) => (
                  <li 
                    key={product.id} 
                    className="quick-list-item"
                    onClick={() => handleQuickSearchSelect(product)}
                    tabIndex={0} 
                  >
                    <img 
                      src={product.image || 'https://placehold.co/45'} 
                      alt={product.name} // FIX: using name
                      onError={(e) => e.target.src='https://placehold.co/45?text=IMG'}
                    />
                    <div>
                      <div className="item-name">{product.name}</div> {/* FIX: using name */}
                      <div className="item-details">{product.category} | {formatPrice(product.price)}</div>
                    </div>
                  </li>
                ))
              ) : (
                <li style={{ padding: '10px 15px', color: '#666' }}>No matches found for "{quickSearchTerm}"</li>
              )}
            </ul>
          </div>
        )}
        
        <button 
          id="quick-list-toggle"
          onClick={toggleQuickList}
          aria-label={isQuickListOpen ? "Close Quick List" : "Open Quick Product List"}
        >
          {isQuickListOpen ? '✕' : '🔎'}
        </button>
      </div>


      <Hero />
      <FeaturedCategories categories={categories} />
      <TopRatedProducts products={topRatedProducts} />
      
      {loading ? (
        <div style={{ textAlign: "center", padding: "50px", fontSize: "1.2rem" }}>Loading products...</div>
      ) : error ? (
        <div style={{ color: "red", padding: "20px", textAlign: "center", backgroundColor: "#ffeeee", border: "1px solid red", margin: "20px" }}>
          <strong>Error:</strong> {error}
        </div>
      ) : (
        categories.map((category) => {
          
          return (
            <React.Fragment key={category.name}>
              <section className="shop-area-section" style={{ backgroundColor: "#f8f8f8" }} ref={(el) => (categoryRefs.current[category.name] = el)}>
                
                {/* --- NEW BANNER SYSTEM --- */}
                <div className="shop-overlay" style={{ backgroundColor: "transparent", padding: "20px" }}>
                    <div className="banner-container">
                        <img src={Banner} alt="Category Banner" className="banner-bg" />
                        <div className="banner-text-overlay">
                            <h2 className="banner-script-text">{category.name}</h2>
                            <h3 className="banner-serif-text">AREA</h3>
                        </div>
                    </div>
                    <p style={{ color: "#4a2f0c", fontSize: "20px", fontWeight: "500", textAlign: 'center' }}>Discover our {category.name} collection.</p>
                </div>

              </section>
              <section className="shop-product-display">
                {category.types.map((type) => {
                  
                  const uniqueId = `${category.name}-${type.name}`;
                  
                  return (
                    <div 
                      key={type.name} 
                      className="shop-product-row"
                      id={uniqueId} // The anchor destination
                    >
                      <h2><span>🛋️</span> {category.name} <span className="shop-divider">|</span> {type.name}</h2>
                      <div className="shop-products">
                        {type.products.map((product) => (
                          <div key={product.id} className="shop-item">
                            <img src={product.image || "https://placehold.co/400x300"} alt={product.name} onClick={() => openProductModal(product)} onError={(e) => (e.target.src = "https://placehold.co/400x300/f0f0f0/ccc?text=Image+Error")} />
                            <div className="item-info">
                              {/* FIX: Using product.name */}
                              <p className="item-name">{product.name}</p>
                              <p className="item-price">{formatPrice(product.price)}</p>
                              <p className="item-details-link" onClick={() => openProductModal(product)}>Tap for more details!</p>
                            </div>
                            <button className="shop-item-btn-add" onClick={() => handleAddToCart(product)}>ADD TO CART</button>
                            <button className="shop-item-btn" onClick={() => handleOrderNow(product)}>BUY NOW!</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </section>
            </React.Fragment>
          );
        })
      )}

      <Footer />
      
      {/* --- ALL MODALS (Z-INDEX 10000) --- */}
      {isReviewModalOpen && reviewProduct && (
        <div className="modal-overlay" onClick={closeReviewModal}>
          <div className="modal-content product-modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleReviewSubmit} className="modal-form">
              <div className="product-modal-body">
                <div className="modal-gallery">
                  <div className="modal-main-image">
                    <img src={reviewProduct.image_link_1 || reviewProduct.image || 'https://placehold.co/600x400'} alt={reviewProduct.name} onError={(e) => e.target.src = 'https://placehold.co/600x400/f0f0f0/ccc?text=Image+Not+Found'} />
                  </div>
                  <div className="modal-thumbnail-grid">
                    {getFurnitureImages(reviewProduct).map((imgSrc, index) => (
                      <img key={index} src={imgSrc} alt={`thumb ${index + 1}`} className={(reviewProduct.image_link_1 || reviewProduct.image) === imgSrc ? 'active' : ''} />
                    ))}
                  </div>
                </div>
                <div className="modal-details">
                  <h2>Write a Review</h2>
                  {/* FIX: Using name */}
                  <h3>{reviewProduct.name}</h3>
                  {reviewOrder && reviewOrder.products.length > 1 && (
                    <div className="form-group">
                      <label htmlFor="product">Select Product to Review</label>
                      <select id="product" name="product" value={reviewProduct.id} onChange={(e) => { const newProd = allProducts.find(p => p.id === e.target.value); if (newProd) setReviewProduct(newProd); }}>
                        {reviewOrder.products.map(p => <option key={p.id} value={p.id}>{allProducts.find(ap => ap.id === p.id)?.name || p.id}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="form-group">
                    <label>Your Rating</label>
                    <div className="star-rating">{renderStars(reviewRating, true, setReviewRating)}</div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="comment">Your Comment</label>
                    <textarea id="comment" name="comment" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Share your thoughts..." style={{minHeight: '100px'}} />
                  </div>
                  <div className="modal-error">{reviewError}</div>
                  <div className="modal-reviews">
                    <h3>Existing Reviews</h3>
                   <div className="reviews-list">
                      {loadingModal ? <p>Loading reviews...</p> : productModalReviews.length > 0 ? productModalReviews.map(review => (
                          <div key={review.id} className={`review-item ${review.customerName === userName ? 'review-item-user' : ''}`}>
                            <div className="review-header"><span className="review-name">{review.customerName} {review.customerName === userName && "(You)"}</span><span className="review-rating">{renderStars(review.rating)}</span></div>
                            <p className="review-comment">{review.comment}</p>
                          </div>
                        )) : <p style={{color: '#666', fontSize: '0.9rem'}}>No reviews yet.</p>}
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
      
      {isProductModalOpen && selectedProduct && (
        <div className="modal-overlay" onClick={closeProductModal}>
          <div className="modal-content product-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="product-modal-body">
              <div className="modal-gallery">
                <div className="modal-main-image">
                  <img src={productModalImage} alt={selectedProduct.name} onError={(e) => e.target.src = 'https://placehold.co/600x400/f0f0f0/ccc?text=Image+Not+Found'} />
                </div>
                <div className="modal-thumbnail-grid">
                  {getFurnitureImages(selectedProduct).map((imgSrc, index) => (
                    <img key={index} src={imgSrc} alt={`thumb ${index + 1}`} className={productModalImage === imgSrc ? 'active' : ''} onClick={() => setProductModalImage(imgSrc)} onError={(e) => e.target.style.display = 'none'} />
                  ))}
                </div>
              </div>
              <div className="modal-details">
                {/* FIX: Using name */}
                <h2>{selectedProduct.name}</h2>
                <span className="price">{formatPrice(selectedProduct.price)}</span>
                <div className="modal-info-grid">
                  <div className="info-item"><label>Category</label><span>{selectedProduct.category}</span></div>
                  <div className="info-item"><label>Type</label><span>{selectedProduct.type}</span></div>
                  <div className="info-item"><label>Stock</label><span>{selectedProduct.stock} units</span></div>
                  <div className="info-item"><label>Dimensions</label><span>{selectedProduct.dimensions?.length || 'N/A'}cm x {selectedProduct.dimensions?.width || 'N/A'}cm x {selectedProduct.dimensions?.height || 'N/A'}cm</span></div>
                </div>
                <div className="modal-description"><h3>Description</h3><p>{selectedProduct.description || "No description provided."}</p></div>
                <div className="modal-reviews">
                    <h3>Reviews</h3>
                    <div className="reviews-list">
                      {loadingModal ? <p>Loading reviews...</p> : productModalReviews.length > 0 ? productModalReviews.map(review => (
                          <div key={review.id} className={`review-item ${review.customerName === userName ? 'review-item-user' : ''}`}>
                            <div className="review-header"><span className="review-name">{review.customerName} {review.customerName === userName && "(You)"}</span><span className="review-rating">{renderStars(review.rating)}</span></div>
                            <p className="review-comment">{review.comment}</p>
                          </div>
                        )) : <p style={{color: '#666', fontSize: '0.9rem'}}>No reviews yet.</p>}
                    </div>
                </div>
              </div>
            </div>
            <div className="product-modal-actions">
              <div className="action-buttons-group">
                <button className="ud-action-btn" onClick={() => handleAddToCart(selectedProduct)}><span>🛒</span> Add to Cart</button>
                <button className="ud-action-btn" onClick={() => handleOrderNow(selectedProduct)}><span>&#8634;</span> Order Now</button>
              </div>
              <button className="close-btn" onClick={closeProductModal}>Close</button>
            </div>
          </div>
        </div>
      )}
      
      {isConfirmationModalOpen && confirmationOrderDetails && (
        <div className="modal-overlay" onClick={closeConfirmationModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Your Order</h2>
            <form onSubmit={handleConfirmOrder} className="modal-form">
              <div className="confirmation-receipt">
                {/* FIX: Using name for confirmation */}
                <div className="receipt-item"><span>{confirmationOrderDetails.product.name} (x1)</span><strong>{formatPrice(confirmationOrderDetails.product.price)}</strong></div>
                <div className="receipt-item receipt-total"><span>Total</span><strong>{formatPrice(confirmationOrderDetails.total)}</strong></div>
              </div>
              <div className="form-group">
                <label htmlFor="paymentMethod">Payment Method</label>
                <select id="paymentMethod" name="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="Cash on Delivery">Cash on Delivery</option>
                  <option value="GCash">GCash</option>
                  <option value="Credit Card">Credit Card (Mock)</option>
                </select>
              </div>
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
}