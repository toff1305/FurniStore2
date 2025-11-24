const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema({
  customer_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Customer", 
    required: true 
  },
  // We use an array of items so one Cart document holds the whole shopping list
  items: [
    {
      product_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Product", 
        required: true 
      },
      quantity: { 
        type: Number, 
        required: true, 
        min: 1, 
        default: 1 
      }
    }
  ],
  updated_at: { type: Date, default: Date.now }
});

// Optional: Middleware to update the 'updated_at' field automatically
CartSchema.pre("save", function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model("Cart", CartSchema);