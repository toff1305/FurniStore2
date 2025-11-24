const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// --- GET CART (Get items for a specific user) ---
router.get("/:customerId", async (req, res) => {
  try {
    // FIXED: Added nested population to get the Image URL inside the Product
    const cart = await Cart.findOne({ customer_id: req.params.customerId })
      .populate({
        path: "items.product_id", 
        populate: {
          path: "images_id", // This fetches the actual Image document
          model: "Images"
        }
      }); 
    
    if (!cart) {
      return res.status(200).json({ items: [] }); // Return empty cart if none exists
    }
    res.json(cart);
  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- ADD TO CART (Add or Update quantity) ---
router.post("/add", async (req, res) => {
  const { customer_id, product_id, quantity } = req.body;

  try {
    // 1. Check if cart exists for this user
    let cart = await Cart.findOne({ customer_id });

    if (cart) {
      // 2. Cart exists - check if product is already in it
      const itemIndex = cart.items.findIndex(p => p.product_id == product_id);

      if (itemIndex > -1) {
        // Product exists, update quantity
        cart.items[itemIndex].quantity += quantity;
      } else {
        // Product not in cart, add new item
        cart.items.push({ product_id, quantity });
      }
      cart = await cart.save();
      return res.status(200).json(cart);
    } else {
      // 3. No cart exists, create a new one
      const newCart = await Cart.create({
        customer_id,
        items: [{ product_id, quantity }]
      });
      return res.status(201).json(newCart);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- DELETE ITEM FROM CART ---
router.delete("/remove", async (req, res) => {
    const { customer_id, product_id } = req.body;
    try {
        let cart = await Cart.findOne({ customer_id });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        // Filter out the item to remove it
        cart.items = cart.items.filter(item => item.product_id != product_id);
        
        await cart.save();
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;