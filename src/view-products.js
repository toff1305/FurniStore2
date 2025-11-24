import React, { useState, useEffect, useCallback } from "react";
import "./view-furnitures.css"; // Styles are embedded below
import Topbar from "./topbar-admin"; // Using placeholder
import logo from './assets/logo.png';

// --- 1. HELPER COMPONENT: Fading Notification ---
const FadingNotification = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, 3000); // Show for 3 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`custom-notification ${type} ${visible ? 'show' : ''}`}>
      {type === 'success' ? '✅' : '⚠️'} {message}
    </div>
  );
};

// --- 2. HELPER COMPONENT: Inline Confirmation Button ---
// Replaces window.confirm. Click once to arm, click again to execute.
const InlineConfirmButton = ({ onConfirm, label, icon, className, style }) => {
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (isConfirming) {
      const timer = setTimeout(() => setIsConfirming(false), 3000); // Reset after 3s if not clicked
      return () => clearTimeout(timer);
    }
  }, [isConfirming]);

  if (isConfirming) {
    return (
      <button 
        type="button"
        className={className} 
        style={{ ...style, backgroundColor: '#dc2626', color: 'white', borderColor: '#dc2626' }} // Red for danger
        onClick={(e) => {
          e.stopPropagation();
          onConfirm();
          setIsConfirming(false);
        }}
      >
        <span>❓</span> Confirm?
      </button>
    );
  }

  return (
    <button 
      type="button"
      className={className} 
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        setIsConfirming(true);
      }}
    >
      {icon && <span>{icon}</span>} {label}
    </button>
  );
};


// --- Main ViewFurnitures Component ---
function ViewFurnitures() {
  const navigate = (path) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Notification State ---
  const [notification, setNotification] = useState(null); // { message: "", type: "success" | "error" }

  // --- Data State ---
  const [allProducts, setAllProducts] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [allProductTypes, setAllProductTypes] = useState([]);
  const [topRatedProducts, setTopRatedProducts] = useState([]);
  const [groupedCategories, setGroupedCategories] = useState([]); 

  // --- Tab Navigation & Filtering State ---
  const [activeTab, setActiveTab] = useState("All"); 
  const [filteredProducts, setFilteredProducts] = useState([]);

  // --- State for View Product Modal ---
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalImage, setProductModalImage] = useState("");
  const [productModalReviews, setProductModalReviews] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);
  
  // --- State for Add/Edit Modal ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFurniture, setCurrentFurniture] = useState(null);

  // --- State for Category Modal ---
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTypeName, setNewTypeName] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingType, setEditingType] = useState(null);
  
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName");

  // --- Helper Functions ---
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const formatPrice = (price) => {
    const numericPrice = Number(price) || 0;
    return `PHP ${new Intl.NumberFormat('en-US').format(numericPrice)}.00`;
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => {
      const ratingValue = index + 1;
      return (
        <span key={ratingValue} className={ratingValue <= rating ? 'on' : 'off'}>★</span>
      );
    });
  };

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, reviewsRes, typesRes] = await Promise.all([
        fetch("http://localhost:5000/api/products"),
        fetch("http://localhost:5000/api/reviews"),
        fetch("http://localhost:5000/api/categories-and-types")
      ]);

      if (!productsRes.ok || !reviewsRes.ok || !typesRes.ok) {
        throw new Error("Failed to fetch data.");
      }

      const productsData = await productsRes.json();
      const reviewsData = await reviewsRes.json();
      const typesData = await typesRes.json();
      
      setAllProducts(productsData);
      setAllReviews(reviewsData);
      setAllCategories(typesData.categories);
      setAllProductTypes(typesData.productTypes);
      
      if (typesData.categories.length > 0 && !activeCategoryId) {
        setActiveCategoryId(typesData.categories[0]._id);
      }

      // 1. Top Rated Logic
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

      // 2. Grouping Logic
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
      setGroupedCategories(categoryList);

    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userName, activeCategoryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === "All") {
      setFilteredProducts(allProducts);
    } else if (activeTab === "Top Rated") {
      setFilteredProducts(topRatedProducts);
    } else {
      setFilteredProducts(allProducts.filter(p => p.category === activeTab));
    }
  }, [activeTab, allProducts, topRatedProducts]);


  // --- Modal Handlers ---

  const openProductModal = (product) => {
    const reviews = allReviews.filter(r => r.productId === product.id);
    setSelectedProduct(product);
    setProductModalReviews(reviews);
    setProductModalImage(product.image_link_1 || 'https://placehold.co/600x400');
    setIsViewModalOpen(true);
  };
  const closeProductModal = () => setIsViewModalOpen(false);

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentFurniture({
      name: "",
      price: 0,
      stock: 0,
      description: "",
      categoryId: allCategories[0]?._id || "",
      typeId: "",
      dimensions: { length: 0, width: 0, height: 0 },
      image_link_1: "", image_link_2: "", image_link_3: "", image_link_4: "", image_link_5: "",
    });
    setIsEditModalOpen(true);
    setIsViewModalOpen(false);
  };

  const openEditModal = (furniture) => {
    setIsEditing(true);
    const dimensions = furniture.dimensions || { length: 0, width: 0, height: 0 };
    setCurrentFurniture({...furniture, dimensions }); 
    setIsEditModalOpen(true);
    setIsViewModalOpen(false);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentFurniture(null);
  };

  // --- REPLACED WINDOW.CONFIRM with inline logic in render, logic here is direct ---
  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      showNotification("Not authorized. Please log in again.", "error");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to delete product");
      
      showNotification("Product deleted successfully!", "success");
      closeProductModal();
      fetchData();
    } catch (err) {
      showNotification("Error: " + err.message, "error");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return showNotification("Not authorized.", "error");

    const url = isEditing 
      ? `http://localhost:5000/api/products/${currentFurniture.id}`
      : "http://localhost:5000/api/products";
    const method = isEditing ? "PUT" : "POST";

    const payload = {
      ...currentFurniture,
      dimensions: {
        length: Number(currentFurniture.dimensions?.length) || 0,
        width: Number(currentFurniture.dimensions?.width) || 0,
        height: Number(currentFurniture.dimensions?.height) || 0,
      }
    };

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} product`);
      
      showNotification(`Product ${isEditing ? 'updated' : 'added'} successfully!`, "success");
      closeEditModal();
      fetchData();
    } catch (err) {
      showNotification("Error: " + err.message, "error");
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === "categoryId") {
      setCurrentFurniture(prev => ({ ...prev, categoryId: value, typeId: "" }));
    } else {
      setCurrentFurniture(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleDimensionChange = (e) => {
     const { name, value } = e.target;
     setCurrentFurniture(prev => ({
       ...prev,
       dimensions: { ...prev.dimensions, [name]: value }
     }));
  };
  
  // --- Category Modal Handlers ---
  const openCategoryModal = () => setIsCategoryModalOpen(true);
  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    setEditingType(null);
    setNewCategoryName("");
    setNewTypeName("");
    fetchData();
  }

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName) return showNotification("Enter category name.", "error");
    const token = localStorage.getItem("token");
    if (!token) return showNotification("Not authorized.", "error");

    const isUpdating = !!editingCategory;
    const url = isUpdating 
      ? `http://localhost:5000/api/categories/${editingCategory._id}`
      : "http://localhost:5000/api/categories";
    const method = isUpdating ? "PUT" : "POST";
    try {
      const response = await fetch(url, {
        method: method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ category_name: newCategoryName }),
      });
      if (!response.ok) throw new Error("Failed to save category");
      
      const savedCategory = await response.json();
      if (isUpdating) {
        setAllCategories(allCategories.map(c => c._id === savedCategory._id ? savedCategory : c));
      } else {
        setAllCategories([...allCategories, savedCategory]);
        setActiveCategoryId(savedCategory._id);
      }
      setNewCategoryName("");
      setEditingCategory(null);
      showNotification(`Category ${isUpdating ? 'updated' : 'added'}!`, "success");
    } catch (err) {
      showNotification("Error: " + err.message, "error");
    }
  };

  const handleEditCategoryClick = (category) => {
    setEditingCategory(category);
    setNewCategoryName(category.category_name);
  };
  
  const handleDeleteCategory = async (categoryId) => {
    // No window.confirm here, handled by InlineConfirmButton
    const token = localStorage.getItem("token");
    if (!token) return showNotification("Not authorized.", "error");

    try {
      const response = await fetch(`http://localhost:5000/api/categories/${categoryId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Cannot delete category (might differ for strict reasons)");
      
      setAllCategories(allCategories.filter(c => c._id !== categoryId));
      if (activeCategoryId === categoryId) setActiveCategoryId(allCategories[0]?._id || null);
      showNotification("Category deleted.", "success");
    } catch (err) {
       showNotification("Error: " + err.message, "error");
    }
  };

  const handleSaveType = async (e) => {
     e.preventDefault();
     if (!newTypeName || !activeCategoryId) return showNotification("Select category and enter name.", "error");
     const token = localStorage.getItem("token");
     if (!token) return showNotification("Not authorized.", "error");

     const isUpdating = !!editingType;
     const url = isUpdating
       ? `http://localhost:5000/api/product-types/${editingType._id}`
       : "http://localhost:5000/api/product-types";
     const method = isUpdating ? "PUT" : "POST";
     try {
       const response = await fetch(url, {
         method: method,
         headers: { 
           "Content-Type": "application/json",
           "Authorization": `Bearer ${token}`
         },
         body: JSON.stringify({ 
           category_id: activeCategoryId, 
           product_type_name: newTypeName 
         }),
       });
       if (!response.ok) throw new Error("Failed to save type");
       const savedType = await response.json();
       if (isUpdating) {
         setAllProductTypes(allProductTypes.map(t => t._id === savedType._id ? savedType : t));
       } else {
         setAllProductTypes([...allProductTypes, savedType]);
       }
       setNewTypeName("");
       setEditingType(null);
       showNotification(`Product type ${isUpdating ? 'updated' : 'added'}!`, "success");
     } catch (err) {
       showNotification("Error: " + err.message, "error");
     }
  };

  const handleEditTypeClick = (type) => {
    setEditingType(type);
    setNewTypeName(type.product_type_name);
    setActiveCategoryId(type.category_id._id);
  };

  const handleDeleteType = async (typeId) => {
     // No window.confirm here, handled by InlineConfirmButton
     const token = localStorage.getItem("token");
     if (!token) return showNotification("Not authorized.", "error");

     try {
       const response = await fetch(`http://localhost:5000/api/product-types/${typeId}`, {
         method: "DELETE",
         headers: { "Authorization": `Bearer ${token}` }
       });
       if (!response.ok) throw new Error("Failed to delete product type");
       setAllProductTypes(allProductTypes.filter(t => t._id !== typeId));
       showNotification("Product type deleted.", "success");
     } catch (err) {
       showNotification("Error: " + err.message, "error");
     }
  };
  
  const getFurnitureImages = (product) => {
    if (!product) return [];
    return [
      product.image_link_1, product.image_link_2, product.image_link_3, 
      product.image_link_4, product.image_link_5
    ].filter(Boolean); 
  };

  const availableTypesForEdit = currentFurniture
    ? allProductTypes.filter(pt => pt.category_id?._id === currentFurniture.categoryId)
    : [];
    
  const typesForActiveCategory = allProductTypes.filter(
    (type) => type.category_id?._id === activeCategoryId
  );
  
  const activeCategoryName = allCategories.find(c => c._id === activeCategoryId)?.category_name || "...";


  // --- Main Return ---
  return (
    <div className="view-furniture-page">
      <style>
        {`
          /* === Fading Notification Styles === */
          .custom-notification {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-20px);
            background-color: #333;
            color: white;
            padding: 12px 24px;
            border-radius: 50px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 9999; /* Higher than modals (usually 1000) */
            font-weight: 600;
            font-size: 1rem;
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
            pointer-events: none;
          }
          .custom-notification.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          .custom-notification.success {
            background-color: #10b981; /* Green */
          }
          .custom-notification.error {
            background-color: #ef4444; /* Red */
          }

          /* Existing Styles Preserved */
          .logo-section { display: flex; flex-direction: column; align-items: center; gap: 15px; }
          .logo-image { width: 80px; height: 80px; object-fit: cover; border-radius: 50%; }
          .logo-text { margin: 0; font-size: 25px !important; font-weight: 600; text-align: center; }
          .admin-bar { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #ddd; margin-bottom: 20px; }
          .admin-bar h1 { font-size: 1.5rem; color: #333; }
          .admin-buttons { display: flex; gap: 15px; }
          .add-btn-out, .manage-cat-btn { color: #333 !important; border: 3px solid #333 !important; padding: 7px 14px; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 20px; background-color: transparent; font-variant: small-caps; display: inline-block; transition: 0.3s; }
          .manage-cat-btn { font-size: 16px; padding: 9px 14px; background-color: #f1f3f8ff; border-color: #333 !important; color: black; font-variant: normal; }
          .add-btn-out:hover, .manage-cat-btn:hover { background-color: #333 !important; color:white !important; border-color: rgba(232, 231, 236, 1); }
          .shop-category-tabs { display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; padding: 20px 40px; background-color: #f2ecd5; z-index: 99; }
          .tab-btn { padding: 10px 20px; font-size: 1rem; font-weight: 600; color: #333 !important; background-color: #fff; border: 2px solid #e6dcaa; border-radius: 20px; cursor: pointer; transition: all 0.2s; }
          .tab-btn:hover { background-color: #fff; border-color: #4a2f0c; }
          .tab-btn.active { background-color: #333 !important; color: white !important; border-color:white; }
          .shop-product-display { padding: 20px 0 60px 0; }
          .shop-products { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
          .shop-item { background: #fff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden; transition: box-shadow 0.3s; display: flex; flex-direction: column; }
          .shop-item:hover { box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
          .shop-item img { width: 100%; height: 220px; object-fit: cover; cursor: pointer; }
          .item-info { padding: 15px; flex-grow: 1; text-align: center; }
          .item-name { font-weight: 600; font-size: 1.1rem; }
          .item-price { font-weight: 700; color: #3b82f6; margin: 5px 0; }
          .item-details-link { font-size: 0.9rem; font-style: italic; color: #555; cursor: pointer; text-decoration: underline; }
          .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; }
          .modal-content { background-color: #fff; padding: 20px; border-radius: 12px; width: 90%; max-width: 600px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); max-height: 90vh; overflow-y: auto; }
          .modal-content h2 { font-size: 1.8rem; font-weight: 600; color: #333; margin-bottom: 25px; text-align: center; }
          .modal-form { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .form-group { display: flex; flex-direction: column; }
          .form-group.full-width { grid-column: 1 / -1; }
          .form-group label { font-size: 0.9rem; font-weight: 500; margin-bottom: 5px; color: #555; }
          .modal-form input, .modal-form textarea, .modal-form select { width: 100%; padding: 10px; font-size: 1rem; border: 1px solid #ccc; border-radius: 6px; }
          .dimensions-group { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
          .image-links-group { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .modal-actions { display: flex; gap: 10px; margin-top: 20px; grid-column: 1 / -1; justify-content: flex-end; }
          .cancel-btn, .save-btn, .close-btn { height: 45px; padding: 12px 25px; border: none; border-radius: 25px; font-weight: 700; cursor: pointer; transition: 0.3s; font-size: 15px; }
          .cancel-btn { background-color: #eee; color: #555; border: 1px solid #ccc; }
          .cancel-btn:hover { background-color: #ddd; }
          .save-btn, .close-btn { background-color: #485168; color: white; }
          .save-btn:hover, .close-btn:hover { background-color: #3a4255; }
          .star-rating span { color: #f59e0b; margin-right: 2px; }
          .star-rating span.off { color: #ccc; }
          
          /* Product Modal Specifics */
          .product-modal-content { max-width: 900px; padding: 0; display: flex; flex-direction: column; overflow: hidden; }
          .product-modal-body { display: grid; grid-template-columns: 400px 1fr; gap: 25px; padding: 25px; overflow-y: auto; }
          .modal-gallery { display: flex; flex-direction: column; gap: 10px; }
          .modal-main-image img { width: 100%; height: 350px; object-fit: cover; border-radius: 8px; }
          .modal-thumbnail-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
          .modal-thumbnail-grid img { width: 100%; height: 60px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 2px solid transparent; }
          .modal-thumbnail-grid img.active { border-color: #3b82f6; }
          .modal-details { display: flex; flex-direction: column; gap: 15px; }
          .modal-details h2 { text-align: left; margin: 0; }
          .modal-details .price { font-size: 1.5rem; font-weight: 700; color: #3b82f6; }
          .modal-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .info-item { background-color: #f8f8f8; padding: 10px; border-radius: 6px; }
          .info-item label { display: block; font-size: 0.8rem; color: #666; }
          .info-item span { font-size: 1rem; font-weight: 600; }
          .modal-description { background-color: #f8f8f8; padding: 10px; border-radius: 6px; flex-grow: 1; }
          .modal-reviews { flex-grow: 1; display: flex; flex-direction: column; min-height: 150px; }
          .reviews-list { border: 1px solid #eee; border-radius: 6px; padding: 10px; flex: 1; overflow-y: auto; max-height: 200px; }
          .review-item { border-bottom: 1px solid #f0f0f0; padding: 10px 0; }
          .review-item-user { background-color: #eef2ff; border-left: 4px solid #3b82f6; padding: 10px; }
          .review-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .product-modal-actions { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding: 15px 25px; background-color: #f9fafb; }
          .action-buttons-group { display: flex; gap: 10px; }
          .ud-action-btn { border: none; border-radius: 5px; padding: 6px 12px; font-weight: 500; cursor: pointer; font-size: 0.85rem; color: white; display: flex; align-items: center; gap: 5px; transition: background-color 0.2s; }
          
          /* Category Modal */
          .category-modal-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
          .category-modal-form .form-group { display: flex; flex-direction: row; gap: 10px; align-items: center; }
          .category-modal-form input { flex: 1; }
          .category-list-container { max-height: 250px; overflow-y: auto; border: 1px solid #eee; border-radius: 5px; padding: 5px; margin-top: 10px; }
          .category-list-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; border-bottom: 1px solid #f0f0f0; cursor: pointer; border-radius: 4px; }
          .category-list-item.active-category { background-color: #e0e7ff; font-weight: bold; }
          .list-item-actions button { font-size: 0.8rem; padding: 2px 6px; margin-left: 5px; border: 1px solid #ccc; border-radius: 3px; cursor: pointer; }

          .delete-btns { background-color: #fee2e2; color: #991b1b; border-color: #fecaca; }

          @media (max-width: 900px) {
            .admin-bar { flex-direction: column; gap: 15px; }
            .product-modal-body { grid-template-columns: 1fr; }
            .modal-main-image img { height: 250px; }
            .category-modal-columns { grid-template-columns: 1fr; }
          }
        `}
      </style>
      
      {/* --- Fading Notification Component Rendered Here --- */}
      {notification && (
        <FadingNotification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

      <div className="admin-container">
        {/* --- SIDEBAR --- */}
        <aside className="sidebar">
             <div className="logo-section">
  <img src={logo} alt="Company Logo" className="logo-image" />
  <h2 className="logo-text">Nest & Nook</h2>
</div>
          <nav className="sidebar-nav">
            <a href="/admin">Dashboard</a>
            <a href="/view-products" className="active">View Products</a>
            <a href="/manage-furnitures">Manage Furnitures</a>
            <a href="/manage-orders">Manage Orders</a>
            <a href="/manage-users">Manage Users</a>
          </nav>
        </aside>
        
        {/* --- MAIN CONTENT --- */}
        <div className="main-content">
          <Topbar />
          
          <div className="admin-bar">
            <h1>Admin Product View</h1>
            <div className="admin-buttons">
              <button className="manage-cat-btn" onClick={openCategoryModal}>+ Manage Categories</button>
              <button className="add-btn-out" onClick={openAddModal}>+ Add New Furniture</button>
            </div>
          </div>
          
          <div className="shop-category-tabs">
            <button className={`tab-btn ${activeTab === "All" ? 'active' : ''}`} onClick={() => setActiveTab("All")}>All Products</button>
            <button className={`tab-btn ${activeTab === "Top Rated" ? 'active' : ''}`} onClick={() => setActiveTab("Top Rated")}>Top Rated</button>
            {groupedCategories.map(cat => (
              <button key={cat.name} className={`tab-btn ${activeTab === cat.name ? 'active' : ''}`} onClick={() => setActiveTab(cat.name)}>{cat.name}</button>
            ))}
          </div>
          
          {loading ? (
            <div style={{textAlign: 'center', padding: '50px', fontSize: '1.2rem'}}>Loading products...</div>
          ) : error ? (
            <div style={{ color: 'red', padding: '20px', textAlign: 'center', backgroundColor: '#ffeeee', border: '1px solid red', margin: '20px' }}>
              <strong>Error:</strong> {error}
            </div>
          ) : (
            <section className="shop-product-display">
              <div className="shop-products">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <div key={product.id} className="shop-item">
                      <img 
                        src={product.image || 'https://placehold.co/400x300'} 
                        alt={product.name} 
                        onClick={() => openProductModal(product)}
                        onError={(e) => e.target.src = 'https://placehold.co/400x300/f0f0f0/ccc?text=Image+Error'}
                      />
                      <div className="item-info">
                        <p className="item-name">{product.name}</p>
                        <p className="item-price">{formatPrice(product.price)}</p>
                        <p className="item-details-link" onClick={() => openProductModal(product)}>Tap for more details!</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{textAlign: 'center', padding: '50px', fontSize: '1.2rem', color: '#666'}}>No products found for "{activeTab}".</p>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
      
      {/* --- ALL MODALS --- */}
      
      {/* --- Add/Edit Furniture Modal --- */}
      {isEditModalOpen && currentFurniture && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{isEditing ? "Edit Furniture" : "Add New Furniture"}</h2>
            <form className="modal-form" onSubmit={handleFormSubmit}>
              <div className="form-group full-width">
                <label htmlFor="name">Product Name</label>
                <input id="name" name="name" type="text" {...isEditing ? { value: currentFurniture.name } : { value: currentFurniture.name || '' }} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="categoryId">Category</label>
                <select id="categoryId" name="categoryId" value={currentFurniture.categoryId} onChange={handleFormChange}>
                  <option value="">Select Category</option>
                  {allCategories.map(cat => <option key={cat._id} value={cat._id}>{cat.category_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="typeId">Product Type</label>
                <select id="typeId" name="typeId" value={currentFurniture.typeId} onChange={handleFormChange} disabled={!currentFurniture.categoryId || availableTypesForEdit.length === 0}>
                  <option value="">{!currentFurniture.categoryId ? "Select category first" : availableTypesForEdit.length === 0 ? "No types for this category" : "-- Select Type --"}</option>
                  {availableTypesForEdit.map(type => <option key={type._id} value={type._id}>{type.product_type_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="price">Price (PHP)</label>
                <input id="price" name="price" type="number" value={currentFurniture.price} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="stock">Stock Quantity</label>
                <input id="stock" name="stock" type="number" value={currentFurniture.stock} onChange={handleFormChange} required />
              </div>
              <div className="form-group full-width">
                <label>Dimensions (cm)</label>
                <div className="dimensions-group">
                  <input name="length" type="number" placeholder="Length" value={currentFurniture.dimensions?.length} onChange={handleDimensionChange} />
                  <input name="width" type="number" placeholder="Width" value={currentFurniture.dimensions?.width} onChange={handleDimensionChange} />
                  <input name="height" type="number" placeholder="Height" value={currentFurniture.dimensions?.height} onChange={handleDimensionChange} />
                </div>
              </div>
              <div className="form-group full-width">
                <label htmlFor="description">Description</label>
                <textarea id="description" name="description" rows="3" value={currentFurniture.description} onChange={handleFormChange}></textarea>
              </div>
              <div className="image-links-group">
                {[1,2,3,4,5].map(num => (
                  <div className="form-group" key={num}>
                    <label>Image Link {num}</label>
                    <input type="url" name={`image_link_${num}`} value={currentFurniture[`image_link_${num}`]} onChange={handleFormChange} />
                  </div>
                ))}
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeEditModal}>Cancel</button>
                <button type="submit" className="save-btn">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* --- Manage Category Modal --- */}
      {isCategoryModalOpen && (
        <div className="modal-overlay" onClick={closeCategoryModal}>
          <div className="modal-content" style={{maxWidth: '800px'}} onClick={(e) => e.stopPropagation()}>
            <h2>Manage Categories & Types</h2>
            <div className="category-modal-columns">
              <div>
                <h3>Categories</h3>
                <form className="category-modal-form" onSubmit={handleSaveCategory}>
                  <div className="form-group">
                    <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder={editingCategory ? "Update name..." : "New category name..."} />
                    <button type="submit" className="save-btn" style={{padding: '8px 12px', flex: '0 0 auto'}}>{editingCategory ? "✓" : "+"}</button>
                    {editingCategory && <button type="button" className="cancel-btn" style={{flex: '0 0 auto'}} onClick={() => { setEditingCategory(null); setNewCategoryName(""); }}>Cancel</button>}
                  </div>
                </form>
                <div className="category-list-container">
                  {allCategories.map(cat => (
                    <div key={cat._id} className={`category-list-item ${activeCategoryId === cat._id ? 'active-category' : ''}`} onClick={() => setActiveCategoryId(cat._id)}>
                      <span className="list-item-name">{cat.category_name}</span>
                      <div className="list-item-actions">
                        <button className="edit-btns" onClick={(e) => { e.stopPropagation(); handleEditCategoryClick(cat); }}>Edit</button>
                        {/* Using InlineConfirmButton for Category Delete */}
                        <InlineConfirmButton 
                          label="Del" 
                          className="delete-btns"
                          onConfirm={() => handleDeleteCategory(cat._id)} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3>Types for {activeCategoryName}</h3>
                <form className="category-modal-form" onSubmit={handleSaveType}>
                  <div className="form-group">
                    <input type="text" value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} placeholder={editingType ? "Update name..." : "New product type name..."} disabled={!activeCategoryId} />
                    <button type="submit" className="save-btn" style={{padding: '8px 12px', flex: '0 0 auto'}} disabled={!activeCategoryId}>{editingType ? "✓" : "+"}</button>
                    {editingType && <button type="button" className="cancel-btn" style={{flex: '0 0 auto'}} onClick={() => { setEditingType(null); setNewTypeName(""); }}>Cancel</button>}
                  </div>
                </form>
                 <div className="category-list-container">
                  {typesForActiveCategory.map(type => (
                    <div key={type._id} className="category-list-item">
                      <span className="list-item-name">{type.product_type_name}</span>
                      <div className="list-item-actions">
                        <button className="edit-btns" onClick={() => handleEditTypeClick(type)}>Edit</button>
                        {/* Using InlineConfirmButton for Type Delete */}
                        <InlineConfirmButton 
                          label="Del" 
                          className="delete-btns"
                          onConfirm={() => handleDeleteType(type._id)} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-actions" style={{gridColumn: '1 / -1'}}>
              <button type="button" className="cancel-btn" style={{flex: '0 0 auto'}} onClick={closeCategoryModal}>Close</button>
            </div>
          </div>
        </div>
      )}
      
      {/* --- Product Detail Modal --- */}
      {isViewModalOpen && selectedProduct && (
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
                    <img key={index} src={imgSrc} alt="thumbnail" className={productModalImage === imgSrc ? 'active' : ''} onClick={() => setProductModalImage(imgSrc)} onError={(e) => e.target.style.display = 'none'} />
                  ))}
                </div>
              </div>
              <div className="modal-details">
                <h2>{selectedProduct.name}</h2>
                <span className="price">{formatPrice(selectedProduct.price)}</span>
                <div className="modal-info-grid">
                  <div className="info-item"><label>Category</label><span>{selectedProduct.category}</span></div>
                  <div className="info-item"><label>Type</label><span>{selectedProduct.type}</span></div>
                  <div className="info-item"><label>Stock</label><span>{selectedProduct.stock} units</span></div>
                  <div className="info-item"><label>Dimensions</label><span>{selectedProduct.dimensions?.length || 'N/A'}cm x {selectedProduct.dimensions?.width || 'N/A'}cm x {selectedProduct.dimensions?.height || 'N/A'}cm</span></div>
                </div>
                <div className="modal-description">
                  <h3>Description</h3>
                  <p>{selectedProduct.description || "No description provided."}</p>
                </div>
                <div className="modal-reviews">
                   <h3>Reviews</h3>
                   <div className="reviews-list">
                      {loadingModal ? <p>Loading reviews...</p> : productModalReviews.length > 0 ? (
                        productModalReviews.map(review => (
                          <div key={review.id} className={`review-item ${review.customerName === userName ? 'review-item-user' : ''}`}>
                            <div className="review-header">
                              <span className="review-name">{review.customerName} {review.customerName === userName && "(You)"}</span>
                              <span className="review-rating">{renderStars(review.rating)}</span>
                            </div>
                            <p className="review-comment">{review.comment}</p>
                          </div>
                        ))
                      ) : <p style={{color: '#666', fontSize: '0.9rem'}}>No reviews for this product yet.</p>}
                   </div>
                </div>
              </div>
            </div>
            <div className="product-modal-actions">
              <div className="action-buttons-group">
                <button className="ud-action-btn" style={{backgroundColor: '#f59e0b'}} onClick={() => openEditModal(selectedProduct)}>
                  <span>✏️</span> Edit
                </button>
                
                {/* --- INLINE CONFIRM BUTTON for Main Product Delete --- */}
                <InlineConfirmButton 
                  className="ud-action-btn" 
                  style={{backgroundColor: '#ef4444'}}
                  icon="🗑️"
                  label="Delete"
                  onConfirm={() => handleDelete(selectedProduct.id)}
                />

              </div>
              <button className="close-btn" onClick={closeProductModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewFurnitures;