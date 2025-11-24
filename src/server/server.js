require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require('jsonwebtoken'); // --- 1. IMPORT JWT ---

// --- NEW: IMPORT CART ROUTE ---
const cartRoutes = require("./routes/cart"); 

// --- 1. IMPORT YOUR MODELS ---
const Order = require("./models/Order");
const OrderDetail = require("./models/OrderDetail");
const Product = require("./models/Product");
const Customer = require("./models/Customer"); 
const Category = require("./models/Category");
const ProductType = require("./models/ProductType");
const Images = require("./models/Images");
const Payment = require("./models/Payment"); 
const Review = require("./models/Review");
const Cart = require("./models/Cart"); // <--- FIX 1: ADDED CART MODEL IMPORT

// --- 2. INITIALIZE APP & DEFINE CONSTANTS ---
const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// --- 3. APPLY MIDDLEWARE ---
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// --- NEW: USE CART ROUTE ---
app.use("/api/cart", cartRoutes);

// --- 4. CONNECT TO MONGODB ---
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Successfully connected to MongoDB Atlas!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- 4.5. NEW: AUTHENTICATION MIDDLEWARE ---

/**
 * @description Protects routes by checking for a valid JWT in the Authorization header.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (e.g., "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token ID and attach to request object
      req.user = await Customer.findById(decoded.id).select('-password');
      
      if (!req.user) {
         return res.status(401).json({ message: "User not found" });
      }

      next(); // Proceed to the route
    } catch (error) {
      console.error("Token verification failed:", error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

/**
 * @description Checks if the user (attached by 'protect' middleware) is an admin.
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};


// --- 5. DEFINE API ENDPOINTS ---

// --- Auth Endpoints for Login/Signup (Public) ---
app.post("/api/register", async (req, res) => {
  try {
    const { customer_name, email, password, phone_number, shipping_address } = req.body;
    
    if (!customer_name || !email || !password || !phone_number || !shipping_address) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existingUser = await Customer.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }
    // The pre-save hook in your Customer.js model will hash the password
    const newUser = new Customer({
      customer_name,
      email,
      password,
      phone_number, 
      shipping_address
    });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Error registering user" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await Customer.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const payload = {
      id: user._id,
      role: user.role,
    };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' } 
    );

    const userRole = user.role || "customer"; 
    res.status(200).json({ 
      message: "Login successful",
      redirect: userRole === "admin" ? "/admin" : "/shop",
      token: token, 
      user: {
        id: user._id,
        name: user.customer_name,
        email: user.email,
        role: userRole
      }
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Error logging in user" });
  }
});


// --- Order & Stat Endpoints (Admin Only) ---
app.get("/api/order-details", [protect, isAdmin], async (req, res) => {
  try {
    const orderDetails = await OrderDetail.find()
      .populate({
        path: "order_id",
        model: "Order",
        populate: {
          path: "customer_id",
          model: "Customer",
        },
      })
      .populate("product_id");
    const formattedData = orderDetails
      .map((detail) => {
        if (!detail.order_id || !detail.product_id || !detail.order_id.customer_id) {
          console.warn("Skipping order with missing data:", detail._id);
          return null;
        }
        return {
          orderId: detail.order_id._id,
          userId: detail.order_id.customer_id.customer_name,
          productName: detail.product_id.product_name,
          orderDate: new Date(detail.order_id.date_of_order).toLocaleDateString(),
          status: detail.order_id.order_status,
        };
      })
      .filter((data) => data !== null);
    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ message: "Error fetching data" });
  }
});

app.get("/api/reviews", async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("customer_id", "customer_name")
      .populate("product_id", "product_name");
    const formattedReviews = reviews.map(review => ({
      id: review._id,
      customerName: review.customer_id?.customer_name || "Anonymous",
      productName: review.product_id?.product_name || "Unknown Product",
      productId: review.product_id?._id || null,
      rating: review.rating,
      comment: review.comment,
      date: review.review_date
    }));
    res.json(formattedReviews);
  } catch (error) {
    console.error("Error fetching all reviews:", error);
    res.status(500).json({ message: "Error fetching reviews" });
  }
});

app.get("/api/stats/total-customers", [protect, isAdmin], async (req, res) => {
  try {
    const count = await Customer.countDocuments();
    res.json({ totalCustomers: count });
  } catch (error) {
    console.error("Error fetching customer count:", error);
    res.status(500).json({ message: "Error fetching data" });
  }
});

app.get("/api/stats/total-products", [protect, isAdmin], async (req, res) => {
  try {
    const count = await Product.countDocuments();
    res.json({ totalProducts: count });
  } catch (error) {
    console.error("Error fetching product count:", error);
    res.status(500).json({ message: "Error fetching data" });
  }
});

// --- Endpoints for ManageOrders.js (Admin Only) ---
app.get("/api/orders", [protect, isAdmin], async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer_id")
      .sort({ date_of_order: -1 }); 
    const orderIds = orders.map(o => o._id);
    const payments = await Payment.find({ order_id: { $in: orderIds } });
    const allOrderDetails = await OrderDetail.find({ order_id: { $in: orderIds } });
    const formattedOrders = orders.map(order => {
      const payment = payments.find(p => p.order_id.equals(order._id));
      const detailsForThisOrder = allOrderDetails.filter(d => d.order_id.equals(order._id));
      const total = detailsForThisOrder.reduce((acc, item) => acc + (item.order_price * item.quantity), 0);
      return {
        id: order._id,
        orderId: order._id.toString().slice(-6).toUpperCase(), 
        userId: order.customer_id?._id.toString().slice(-6).toUpperCase() || 'N/A',
        name: order.customer_id?.customer_name || 'Guest',
        payment: payment?.payment_method || 'N/A',
        total: total,
        status: order.order_status || 'Pending',
        date: order.date_of_order ,
        isLocked: order.isLocked
      };
    });
    res.json(formattedOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Error fetching orders" });
  }
});

app.put("/api/orders/:id/toggle-lock", [protect, isAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    order.isLocked = !order.isLocked;
    await order.save();
    res.json({
      message: `Order is now ${order.isLocked ? "Locked" : "Unlocked"}`,
      isLocked: order.isLocked
    });
  } catch (error) {
    console.error("Error toggling lock:", error);
    res.status(500).json({ message: "Error toggling lock" });
  }
});

app.put("/api/orders/:id/status", [protect, isAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { order_status: status },
      { new: true }
    );
    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    const payment = await Payment.findOne({ order_id: updatedOrder._id });
    const details = await OrderDetail.find({ order_id: updatedOrder._id });
    await updatedOrder.populate('customer_id');
    const total = details.reduce((acc, item) => acc + (item.order_price * item.quantity), 0);
    const formattedOrder = {
        id: updatedOrder._id,
        orderId: updatedOrder._id.toString().slice(-6).toUpperCase(),
        userId: updatedOrder.customer_id?._id.toString().slice(-6).toUpperCase() || 'N/A',
        name: updatedOrder.customer_id?.customer_name || 'Guest',
        payment: payment?.payment_method || 'N/A',
        total: total,
        status: updatedOrder.order_status,
        date: updatedOrder.date_of_order
      };
    res.json(formattedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Error updating status" });
  }
});

app.get("/api/orders/:id/details", [protect, isAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Order ID" });
    }
    const order = await Order.findById(id).populate("customer_id");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    const payment = await Payment.findOne({ order_id: id });
    const details = await OrderDetail.find({ order_id: id }).populate("product_id");
    let subtotal = 0;
    const items = details.map(item => {
      const itemTotal = (item.order_price || 0) * (item.quantity || 0);
      subtotal += itemTotal;
      return {
        id: item.product_id ? item.product_id._id : null,
        name: item.product_id ? item.product_id.product_name : "Product not found",
        image: item.product_id ? (item.product_id.images_id ? "image_placeholder" : "image_placeholder") : "image_placeholder", // Placeholder
        quantity: item.quantity,
        price: item.order_price,
        total: itemTotal,
      };
    });
    res.json({
      id: order._id,
      orderId: order._id.toString().slice(-6).toUpperCase(),
      customerName: order.customer_id?.customer_name || "Guest",
      customerEmail: order.customer_id?.email || "N/A",
      orderStatus: order.order_status,
      orderDate: order.date_of_order,
      paymentMethod: payment?.payment_method || "N/A",
      paymentStatus: payment?.payment_status || "N/A",
      total: subtotal,
      items: items,
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ message: "Error fetching details" });
  }
});

// --- Product, Category, and Type Endpoints ---

// PUBLIC Endpoints
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category_id")
      .populate("product_type_id")
      .populate("images_id");
    const formattedProducts = products.map(p => ({
      id: p._id, 
      name: p.product_name, 
      price: p.price, 
      stock: p.stock_quantity, 
      description: p.product_description, 
      dimensions: p.dimensions, 
      category: p.category_id?.category_name || "N/A", 
      type: p.product_type_id?.product_type_name || "N/A", 
      image: p.images_id?.main_photo_url || null, 
      categoryId: p.category_id?._id || null, 
      typeId: p.product_type_id?._id || null, 
      image_link_1: p.images_id?.main_photo_url || "", 
      image_link_2: p.images_id?.secondary_photo_url || "", 
      image_link_3: p.images_id?.third_photo_url || "", 
      image_link_4: p.images_id?.fourth_photo_url || "", 
      image_link_5: p.images_id?.fifth_photo_url || "",
    }));
    res.json(formattedProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products" });
  }
});

app.get("/api/products/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;
    const reviews = await Review.find({ product_id: id })
      .populate("customer_id", "customer_name") 
      .sort({ review_date: -1 });
    const formattedReviews = reviews.map(review => ({
      id: review._id, customerName: review.customer_id?.customer_name || "Anonymous", rating: review.rating, comment: review.comment, date: review.review_date
    }));
    res.json(formattedReviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Error fetching reviews" });
  }
});

app.get("/api/categories-and-types", async (req, res) => {
  try {
    const categories = await Category.find();
    const productTypes = await ProductType.find().populate("category_id");
    res.json({ categories, productTypes });
  } catch (error) {
      console.error("Error fetching categories/types:", error);
      res.status(500).json({ message: "Error fetching data" });
  }
});

// ADMIN ONLY Product/Category/Type Management
app.post("/api/categories", [protect, isAdmin], async (req, res) => {
  try {
    const { category_name } = req.body;
    if (!category_name) {
      return res.status(400).json({ message: "Category name is required" });
    }
    const existingCategory = await Category.findOne({ category_name: new RegExp(`^${category_name}$`, 'i') });
    if (existingCategory) {
      return res.status(409).json({ message: "Category already exists" });
    }
    const newCategory = new Category({ category_name });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Error creating category" });
  }
});

app.put("/api/categories/:id", [protect, isAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name } = req.body;
    if (!category_name) {
      return res.status(400).json({ message: "Category name is required" });
    }
    const updatedCategory = await Category.findByIdAndUpdate(id, { category_name }, { new: true });
    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: "Error updating category" });
  }
});

app.delete("/api/categories/:id", [protect, isAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const productTypeInUse = await ProductType.findOne({ category_id: id });
    const productInUse = await Product.findOne({ category_id: id });
    if (productTypeInUse || productInUse) {
      return res.status(400).json({ message: "Cannot delete category: It is still in use by products or product types." });
    }
    const deletedCategory = await Category.findByIdAndDelete(id);
    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Error deleting category" });
  }
});

app.post("/api/product-types", [protect, isAdmin], async (req, res) => {
  try {
    const { category_id, product_type_name } = req.body;
    if (!category_id || !product_type_name) {
      return res.status(400).json({ message: "Category ID and Type Name are required" });
    }
    const existingType = await ProductType.findOne({ category_id, product_type_name: new RegExp(`^${product_type_name}$`, 'i') });
    if (existingType) {
      return res.status(409).json({ message: "This product type already exists for this category" });
    }
    const newType = new ProductType({ category_id, product_type_name });
    await newType.save();
    const populatedType = await ProductType.findById(newType._id).populate("category_id");
    res.status(201).json(populatedType);
  } catch (error) {
    console.error("Error creating product type:", error);
    res.status(500).json({ message: "Error creating product type" });
  }
});

app.put("/api/product-types/:id", [protect, isAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const { product_type_name, category_id } = req.body;
    if (!product_type_name || !category_id) {
      return res.status(400).json({ message: "Category ID and Type Name are required" });
    }
    const updatedType = await ProductType.findByIdAndUpdate(id, { product_type_name, category_id }, { new: true });
    if (!updatedType) {
      return res.status(404).json({ message: "Product type not found" });
    }
    const populatedType = await ProductType.findById(updatedType._id).populate("category_id");
    res.json(populatedType);
  } catch (error) {
    console.error("Error updating product type:", error);
    res.status(500).json({ message: "Error updating product type" });
  }
});

app.delete("/api/product-types/:id", [protect, isAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const productInUse = await Product.findOne({ product_type_id: id });
    if (productInUse) {
      return res.status(400).json({ message: "Cannot delete product type: It is still in use by products." });
    }
    const deletedType = await ProductType.findByIdAndDelete(id);
    if (!deletedType) {
      return res.status(404).json({ message: "Product type not found" });
    }
    res.status(200).json({ message: "Product type deleted successfully" });
  } catch (error) {
    console.error("Error deleting product type:", error);
    res.status(500).json({ message: "Error deleting product type" });
  }
});

app.post("/api/products", [protect, isAdmin], async (req, res) => {
  try {
    const { 
      name, price, stock, description, categoryId, typeId, dimensions, 
      image_link_1, image_link_2, image_link_3, image_link_4, image_link_5 
    } = req.body;
    const newProduct = new Product({
      product_name: name, price: Number(price), stock_quantity: Number(stock), product_description: description, category_id: categoryId, product_type_id: typeId, dimensions: dimensions,
    });
    await newProduct.save();
    const newImage = new Images({
      product_id: newProduct._id,
      main_photo_url: image_link_1 || `https://loremflickr.com/320/240/furniture?lock=${newProduct._id}`,
      secondary_photo_url: image_link_2 || null,
      third_photo_url: image_link_3 || null,
      fourth_photo_url: image_link_4 || null,
      fifth_photo_url: image_link_5 || null,
    });
    await newImage.save();
    newProduct.images_id = newImage._id;
    await newProduct.save();
    const populatedProduct = await Product.findById(newProduct._id)
      .populate("category_id")
      .populate("product_type_id")
      .populate("images_id");
    res.status(201).json({
      id: populatedProduct._id, name: populatedProduct.product_name, price: populatedProduct.price, stock: populatedProduct.stock_quantity, description: populatedProduct.product_description, dimensions: populatedProduct.dimensions, category: populatedProduct.category_id?.category_name || "N/A", type: populatedProduct.product_type_id?.product_type_name || "N/A", image: populatedProduct.images_id?.main_photo_url || null, categoryId: populatedProduct.category_id?._id || null, typeId: populatedProduct.product_type_id?._id || null, image_link_1: populatedProduct.images_id?.main_photo_url || "", image_link_2: populatedProduct.images_id?.secondary_photo_url || "", image_link_3: populatedProduct.images_id?.third_photo_url || "", image_link_4: populatedProduct.images_id?.fourth_photo_url || "", image_link_5: populatedProduct.images_id?.fifth_photo_url || "",
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Error creating product" });
  }
});

app.put("/api/products/:id", [protect, isAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, price, stock, description, categoryId, typeId, dimensions,
      image_link_1, image_link_2, image_link_3, image_link_4, image_link_5
    } = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        product_name: name, price: Number(price), stock_quantity: Number(stock), product_description: description, category_id: categoryId, product_type_id: typeId, dimensions: dimensions,
      },
      { new: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (updatedProduct.images_id) {
      await Images.findByIdAndUpdate(updatedProduct.images_id, {
        main_photo_url: image_link_1 || `https://loremflickr.com/320/240/furniture?lock=${updatedProduct._id}`,
        secondary_photo_url: image_link_2 || null, third_photo_url: image_link_3 || null, fourth_photo_url: image_link_4 || null, fifth_photo_url: image_link_5 || null,
      });
    }
    const populatedProduct = await Product.findById(updatedProduct._id)
      .populate("category_id")
      .populate("product_type_id")
      .populate("images_id");
      res.json({
      id: populatedProduct._id, name: populatedProduct.product_name, price: populatedProduct.price, stock: populatedProduct.stock_quantity, description: populatedProduct.product_description, dimensions: populatedProduct.dimensions, category: populatedProduct.category_id?.category_name || "N/A", type: populatedProduct.product_type_id?.product_type_name || "N/A", image: populatedProduct.images_id?.main_photo_url || null, categoryId: populatedProduct.category_id?._id || null, typeId: populatedProduct.product_type_id?._id || null, image_link_1: populatedProduct.images_id?.main_photo_url || "", image_link_2: populatedProduct.images_id?.secondary_photo_url || "", image_link_3: populatedProduct.images_id?.third_photo_url || "", image_link_4: populatedProduct.images_id?.fourth_photo_url || "", image_link_5: populatedProduct.images_id?.fifth_photo_url || "",
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Error updating product" });
  }
});

app.delete("/api/products/:id", [protect, isAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const productToDelete = await Product.findById(id);
    if (!productToDelete) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (productToDelete.images_id) {
      await Images.findByIdAndDelete(productToDelete.images_id);
    }
    await Product.findByIdAndDelete(id);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Error deleting product" });
  }
});

// --- User Management Endpoints (Admin Only) ---
app.get("/api/users", [protect, isAdmin], async (req, res) => {
  try {
    const customers = await Customer.find({}, "customer_name email password phone_number shipping_address role");
    const orders = await Order.find({}, "customer_id"); 
    const formattedUsers = customers.map(customer => {
      const orderCount = orders.filter(order => order.customer_id.equals(customer._id)).length;
      return {
        id: customer._id,
        name: customer.customer_name,
        email: customer.email,
        password: customer.password, // Still sending hashed password, consider removing
        phone: customer.phone_number || "N/A", 
        address: customer.shipping_address || "N/A", 
        role: customer.role,
        orders: orderCount
      };
    });
    res.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

app.put("/api/users/:id", [protect, isAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const { name, password, phone_number, shipping_address } = req.body;
    const user = await Customer.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (name) user.customer_name = name;
    
    // --- MODIFIED: Handle password change ---
    // If a new password is provided, the pre-save hook will hash it
    if (password) {
        user.password = password;
    }
    // --- End Modification ---

    if (phone_number !== undefined) user.phone_number = phone_number;
    if (shipping_address !== undefined) user.shipping_address = shipping_address;
    
    await user.save(); // This triggers the pre-save hook if password was changed
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error updating user" });
  }
});

app.delete("/api/users/:id", [protect, isAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const orderCount = await Order.countDocuments({ customer_id: id });
    if (orderCount > 0) {
      return res.status(400).json({ message: `Cannot delete user: This user has ${orderCount} existing order(s).` });
    }
    const deletedUser = await Customer.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
});

app.get("/api/users/:id/orders", [protect, isAdmin], async (req, res) => {
  try {
    const { id } = req.params; // Admin is asking for a specific user's orders
    const orders = await Order.find({ customer_id: id }).sort({ date_of_order: -1 });
    if (!orders || orders.length === 0) {
      return res.json([]); 
    }
    const orderIds = orders.map(o => o._id);
    const payments = await Payment.find({ order_id: { $in: orderIds } });
    const allOrderDetails = await OrderDetail.find({ order_id: { $in: orderIds } })
      .populate('product_id', 'product_name _id'); 

    const formattedHistory = orders.map(order => {
      const payment = payments.find(p => p.order_id.equals(order._id));
      const details = allOrderDetails.filter(d => d.order_id.equals(order._id));
      const total = details.reduce((acc, item) => acc + (item.order_price * item.quantity), 0);
      const products = details.map(d => ({
        id: d.product_id ? d.product_id._id : null,
        name: d.product_id ? d.product_id.product_name : 'Unknown Product',
        quantity: d.quantity
      }));
      return {
        id: order._id, orderId: order._id.toString().slice(-6).toUpperCase(), date: order.date_of_order, status: order.order_status, products: products, productsString: products.map(p => `${p.quantity}x ${p.name}`).join(', '), payment: payment?.payment_method || 'N/A', total: total
      };
    });
    res.json(formattedHistory);
  } catch (error) {
    console.error("Error fetching user order history:", error);
    res.status(500).json({ message: "Error fetching user order history" });
  }
});

// --- User Profile Page Endpoints (Logged-in Customer) ---

// --- NEW: Gets the *logged-in* user's profile ---
// Changed from /api/profile/:id to /api/profile/me
app.get("/api/profile/me", protect, async (req, res) => {
  try {
    // Get the user ID from the token (via 'protect' middleware)
    const user = await Customer.findById(req.user.id, "customer_name email phone_number shipping_address");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      customer_name: user.customer_name,
      email: user.email,
      phone_number: user.phone_number,
      shipping_address: user.shipping_address
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
});

// --- NEW: Updates the *logged-in* user's profile ---
// Changed from /api/profile/:id to /api/profile/me
app.put("/api/profile/me", protect, async (req, res) => {
  try {
    const { customer_name, email, phone_number, shipping_address } = req.body;
    
    // Get the user from the token
    const user = await Customer.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email && email !== user.email) {
      const existingUser = await Customer.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: "Email already in use" });
      }
      user.email = email;
    }
    user.customer_name = customer_name || user.customer_name;
    user.phone_number = phone_number || user.phone_number;
    user.shipping_address = shipping_address || user.shipping_address;

    await user.save();
    
    res.json({
      customer_name: user.customer_name,
      email: user.email,
      phone_number: user.phone_number,
      shipping_address: user.shipping_address
    });
    
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
});

// --- NEW: Get the *logged-in* user's order history ---
app.get("/api/profile/me/orders", protect, async (req, res) => {
  try {
    const { id } = req.user; // Get ID from token, NOT req.params
    const orders = await Order.find({ customer_id: id }).sort({ date_of_order: -1 });
    if (!orders || orders.length === 0) {
      return res.json([]); 
    }
    
    // --- Copied Logic from /api/users/:id/orders ---
    const orderIds = orders.map(o => o._id);
    const payments = await Payment.find({ order_id: { $in: orderIds } });
    const allOrderDetails = await OrderDetail.find({ order_id: { $in: orderIds } })
      .populate('product_id', 'product_name _id'); 

    const formattedHistory = orders.map(order => {
      const payment = payments.find(p => p.order_id.equals(order._id));
      const details = allOrderDetails.filter(d => d.order_id.equals(order._id));
      const total = details.reduce((acc, item) => acc + (item.order_price * item.quantity), 0);
      const products = details.map(d => ({
        id: d.product_id ? d.product_id._id : null,
        // --- FIX: Ensure product_name is used here ---
        name: d.product_id ? d.product_id.product_name : 'Unknown Product',
        quantity: d.quantity
      }));
      return {
        id: order._id, orderId: order._id.toString().slice(-6).toUpperCase(), date: order.date_of_order, status: order.order_status, products: products, productsString: products.map(p => `${p.quantity}x ${p.name}`).join(', '), payment: payment?.payment_method || 'N/A', total: total
      };
    });
    res.json(formattedHistory);
    // --- End Copied Logic ---

  } catch (error) {
    console.error("Error fetching user order history:", error);
    res.status(500).json({ message: "Error fetching user order history" });
  }
});

// --- FIXED: Endpoint for "Order Now" button ---
app.put("/api/orders/:id/cancel", protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Find the order to check ownership and status
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 2. Security Check: Ensure user owns the order
    if (order.customer_id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: "You are not authorized to cancel this." });
    }

    // 3. Status Check
    if (order.order_status !== "Pending" && order.order_status !== "To Ship") {
      return res.status(400).json({ message: `Cannot cancel order. Current status: ${order.order_status}` });
    }

    // 4. FIX: Use findByIdAndUpdate to avoid validation errors on old data
    await Order.findByIdAndUpdate(id, { 
        order_status: "Cancelled" 
    });
    
    res.status(200).json({ message: "Order cancelled successfully" });
    
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ message: "Error cancelling order" });
  }
});

// --- NEW: Cart Checkout Endpoint (FIX 2: Now removes items from Cart) ---
app.post("/api/checkout", protect, async (req, res) => {
  try {
    console.log("💰 Checkout Request Body:", JSON.stringify(req.body, null, 2)); // Debug log

    // 1. Extract Data
    // Check for 'cartItems' OR 'items'
    const cartItems = req.body.cartItems || req.body.items; 
    const payment_method = req.body.payment_method;
    const total_amount = req.body.total_amount || req.body.total;

    const customer_id = req.user.id;

    // 2. Validation
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }
    if (!payment_method || !total_amount) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    // 3. Create Main Order
    const newOrder = new Order({
      customer_id,
      date_of_order: new Date(),
      order_status: 'Pending',
      total_amount: Number(total_amount)
    });
    await newOrder.save();

    // 4. Process Each Item & Collect IDs for Removal
    const productIdsToRemove = []; // Array to store IDs of items we just bought

    for (const item of cartItems) {
      // --- FIX: Handle various ID names ---
      const productId = item.product_id || item.productId || item._id || item.id; 
      
      // Collect ID to remove from cart later
      if (productId) {
          productIdsToRemove.push(productId);
      }

      // --- FIX: Handle Missing/Invalid Quantity ---
      // Try to find quantity, if missing or invalid, default to 1
      let quantity = Number(item.quantity || item.qty || item.count);
      if (isNaN(quantity) || quantity <= 0) {
          console.warn(`⚠️ Item ${productId} has invalid quantity (${item.quantity}). Defaulting to 1.`);
          quantity = 1;
      }

      // --- FIX: Handle Missing Price ---
      let price = Number(item.price || item.order_price || item.unit_price);
      if (isNaN(price)) {
          console.warn(`⚠️ Item ${productId} has invalid price. Defaulting to 0.`);
          price = 0;
      }

      if (!productId) {
          console.warn("⚠️ Skipping item with no ID:", item);
          continue; 
      }

      const newDetail = new OrderDetail({
        order_id: newOrder._id,
        product_id: productId,
        quantity: quantity,
        order_price: price
      });
      await newDetail.save();

      // Update Stock
      const product = await Product.findById(productId);
      if (product) {
        product.stock_quantity -= quantity;
        await product.save();
      }
    }

    // 5. Create Payment
    const paymentStatus = payment_method === "Cash on Delivery" ? "Pending" : "Awaiting Confirmation";
    const newPayment = new Payment({
      order_id: newOrder._id,
      payment_method,
      payment_status: paymentStatus,
      total_amount: Number(total_amount) 
    });
    await newPayment.save();

    // --- 6. NEW: REMOVE ORDERED ITEMS FROM CART ---
    // We use $pull to remove only the items that were just purchased
    if (productIdsToRemove.length > 0) {
        await Cart.updateOne(
            { customer_id },
            { $pull: { items: { product_id: { $in: productIdsToRemove } } } }
        );
        console.log("🛒 Cart updated: Purchased items removed.");
    }
    // ---------------------------------------------

    console.log("✅ Order Created Successfully:", newOrder._id);

    res.status(201).json({
      message: "Checkout successful!",
      orderId: newOrder._id.toString().slice(-6).toUpperCase(),
      status: newOrder.order_status
    });

  } catch (error) {
    console.error("❌ Checkout Error:", error);
    res.status(500).json({ message: "Server error during checkout: " + error.message });
  }
});

app.post("/api/products/:id/order", protect, async (req, res) => {
  try {
    const { id: productId } = req.params;
    const customer_id = req.user.id;
    
    // Ensure numbers are numbers
    let { payment_method, total_amount, quantity, order_price } = req.body;
    total_amount = Number(total_amount);
    quantity = Number(quantity);
    order_price = Number(order_price);

    console.log("Processing Order:", { customer_id, productId, total_amount, payment_method }); // Debug Log

    if (!customer_id || !payment_method || !productId || !quantity || !order_price) {
      return res.status(400).json({ message: "Missing required order fields." });
    }

    // 1. Check Product Stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    if (product.stock_quantity < quantity) {
      return res.status(400).json({ message: "Insufficient stock." });
    }

    // 2. Create Order
    // FIX: Added 'total_amount' here in case your Schema requires it
    // FIX: Removed 'isLocked' in case your Schema doesn't support it
    const newOrder = new Order({
      customer_id,
      date_of_order: new Date(),
      order_status: 'Pending', 
      total_amount: total_amount 
    });
    await newOrder.save();
    console.log("Order Saved:", newOrder._id); // Debug Log

    // 3. Create Order Detail
    const newOrderDetail = new OrderDetail({
      order_id: newOrder._id,
      product_id: productId,
      quantity,
      order_price: order_price,
    });
    await newOrderDetail.save();
    
    // 4. Create Payment
    const paymentStatus = payment_method === "Cash on Delivery" ? "Pending" : "Awaiting Confirmation";
    const newPayment = new Payment({
      order_id: newOrder._id,
      payment_method,
      payment_status: paymentStatus,
      total_amount: total_amount // Ensure this matches your Payment Schema field name (sometimes it's 'amount')
    });
    await newPayment.save();

    // 5. Update Product Stock
    product.stock_quantity -= quantity;
    await product.save();

    res.status(201).json({
      message: "Order placed successfully!",
      orderId: newOrder._id.toString().slice(-6).toUpperCase(),
      status: newOrder.order_status
    });

  } catch (error) {
    console.error("CRITICAL ERROR Creating Order:", error); // This prints to your VS Code terminal
    res.status(500).json({ message: "Server error: " + error.message });
  }
});
// --- NEW: POST REVIEW ROUTE (Fixes the 404 Error) ---
app.post("/api/reviews", protect, async (req, res) => {
  try {
    const { product_id, customer_id, rating, comment } = req.body;

    // 1. Validation
    if (!product_id || !customer_id || !rating) {
      return res.status(400).json({ message: "Rating and Product ID are required." });
    }

    // 2. Optional: Check if user already reviewed this product
    const existingReview = await Review.findOne({ product_id, customer_id });
    if (existingReview) {
        // Update existing review instead of creating a new one
        existingReview.rating = rating;
        existingReview.comment = comment;
        existingReview.review_date = Date.now();
        await existingReview.save();
        return res.status(200).json({ message: "Review updated successfully" });
    }

    // 3. Create New Review
    const newReview = new Review({
      product_id,
      customer_id,
      rating,
      comment,
      review_date: Date.now()
    });

    await newReview.save();
    res.status(201).json({ message: "Review submitted successfully" });

  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ message: "Server error submitting review" });
  }
});
// --- 6. START SERVER ---
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Export the app for testing if needed
module.exports = app;