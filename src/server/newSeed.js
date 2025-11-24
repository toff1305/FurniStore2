const mongoose = require("mongoose");

// Import all models
const Order = require("./models/Order");
const OrderDetail = require("./models/OrderDetail");
const Product = require("./models/Product");
const Customer = require("./models/Customer");
const Category = require("./models/Category");
const ProductType = require("./models/ProductType");
const Images = require("./models/Images");
const Payment = require("./models/Payment");
const Review = require("./models/Review");

// --- 1. SET YOUR MONGO_URI ---
const MONGO_URI = "mongodb+srv://dbmsfs:dbmsfs@cluster0.fctxzda.mongodb.net/FurnitureStore";

const seedDatabase = async () => {
  try {
    // 2. Connect to the database
    await mongoose.connect(MONGO_URI);
    console.log("✅ Successfully connected to MongoDB for seeding.");

    // 3. Clear all existing data (WARNING: DESTRUCTIVE)
    console.log("🧹 Clearing old data...");
    await OrderDetail.deleteMany({});
    await Payment.deleteMany({});
    await Order.deleteMany({});
    await Review.deleteMany({});
    await Images.deleteMany({});
    await Product.deleteMany({});
    await ProductType.deleteMany({});
    await Category.deleteMany({});
    await Customer.deleteMany({});
    console.log("🗑️ Old data cleared.");

    // 4. Create Customers
    console.log("👤 Creating customers...");
    const customers = await Customer.create([
      {
        customer_name: "Admin User",
        email: "admin@gmail.com",
        password: "admin12345",
        role: "admin",
        phone_number: "09123456789",
        shipping_address: "123 Admin St, Metro Manila"
      },
      {
        customer_name: "Kristine Cruz",
        email: "kristine@gmail.com",
        password: "user12345",
        phone_number: "09111111111",
        shipping_address: "456 User Ave, Quezon City"
      },
      {
        customer_name: "CJ Aroy",
        email: "cj@gmail.com",
        password: "user12345",
        phone_number: "09222222222",
        shipping_address: "789 Guest Rd, Pasig City"
      },
      {
        customer_name: "Hannah Lee",
        email: "hannah@gmail.com",
        password: "user12345",
        phone_number: "09333333333",
        shipping_address: "101 Shopper Blvd, Makati City"
      },
    ]);
    const [admin, user1, user2, user3] = customers;
    console.log(`👤 Created ${customers.length} customers.`);

    // 5. Create Categories
    console.log("🏷️ Creating categories...");
    const categories = await Category.create([
      { category_name: "Bedroom" },
      { category_name: "Dining Room" },
      { category_name: "Living Room" },
    ]);
    const [bedroom, diningRoom, livingRoom] = categories;
    console.log(`🏷️ Created ${categories.length} categories.`);

    // 6. Create Product Types
    console.log("U Creating product types...");
    const productTypes = await ProductType.create([
      // Bedroom
      { category_id: bedroom._id, product_type_name: "Beds" },
      { category_id: bedroom._id, product_type_name: "Vanity" },
      { category_id: bedroom._id, product_type_name: "Wardrobe" },
      // Dining Room
      { category_id: diningRoom._id, product_type_name: "Chairs" },
      { category_id: diningRoom._id, product_type_name: "Table" },
      // Living Room
      { category_id: livingRoom._id, product_type_name: "Center Table" },
      { category_id: livingRoom._id, product_type_name: "Sofa" },
    ]);
    
    // Destructure for easy access
    const [
        pt_beds, pt_vanity, pt_wardrobe,
        pt_chairs, pt_table,
        pt_centerTable, pt_sofa
    ] = productTypes;
    console.log(`U Created ${productTypes.length} product types.`);

    // 7. Create Products
    console.log("🪑 Creating products...");
    const products = await Product.create([
      // --- BEDROOM: BEDS ---
      {
        product_name: "HERA: Double Bed with Side Tables",
        price: 38499, stock_quantity: 10,
        product_description: "Inspired by Hera, the goddess of family and home. Upholstered in plush fabric with built-in side tables and hidden storage.",
        category_id: bedroom._id, product_type_id: pt_beds._id,
        dimensions: { length: 214, width: 227, height: 120 } 
      },
      {
        product_name: "DEMETER: Gupee Luxe Double Bed",
        price: 32999, stock_quantity: 12,
        product_description: "Channeling the serene spirit of Demeter. Features a lush green finish that breathes calm into any bedroom.",
        category_id: bedroom._id, product_type_id: pt_beds._id,
        dimensions: { length: 207, width: 147, height: 122 }
      },
      {
        product_name: "ARTEMIS: Double Bunk Bed Frame",
        price: 24999, stock_quantity: 15,
        product_description: "Graceful like Artemis. Its crisp white finish brightens any room, while the sturdy metal frame ensures long-lasting support.",
        category_id: bedroom._id, product_type_id: pt_beds._id,
        dimensions: { length: 197, width: 143, height: 150 }
      },
      {
        product_name: "IRIS: Storage Twin Bed (White)",
        price: 18990, stock_quantity: 8,
        product_description: "Inspired by Iris, the goddess of harmony. Crafted from durable melamine wood with zinc alloy pulls. Features integrated bottom and side drawers.",
        category_id: bedroom._id, product_type_id: pt_beds._id,
        dimensions: { length: 191, width: 120, height: 39 }
      },
      {
        product_name: "EOS: Twin Storage Bed (Oak)",
        price: 13990, stock_quantity: 10,
        product_description: "Inspired by Eos, goddess of the dawn. High-grade treated wood with customizable storage options and reinforced steel beam.",
        category_id: bedroom._id, product_type_id: pt_beds._id,
        dimensions: { length: 140.1, width: 210.6, height: 30.2 }
      },
      {
        product_name: "NYX: Metal Wide Single Bed (Black)",
        price: 10995, stock_quantity: 15,
        product_description: "Mysterious and powerful like Nyx. Crafted from solid metal tubing with a sleek black frame. Modern, minimalist, and durable.",
        category_id: bedroom._id, product_type_id: pt_beds._id,
        dimensions: { length: 209, width: 111, height: 131 }
      },

      // --- BEDROOM: VANITY ---
      {
        product_name: "ATHENA: Dressing Table",
        price: 15499, stock_quantity: 20,
        product_description: "Radiating the quiet confidence of Athena. Blends strength and sophistication with a dark wood finish and clean lines.",
        category_id: bedroom._id, product_type_id: pt_vanity._id,
        dimensions: { length: 60, width: 40, height: 160 }
      },
      {
        product_name: "APHRODITE: Dressing Table",
        price: 17999, stock_quantity: 18,
        product_description: "Inspired by Aphrodite. Warm sandstone tones and smooth texture create a serene atmosphere.",
        category_id: bedroom._id, product_type_id: pt_vanity._id,
        dimensions: { length: 80, width: 50, height: 135.5 }
      },
      {
        product_name: "PERSEPHONE: Vanity Dresser with Lights",
        price: 22499, stock_quantity: 8,
        product_description: "Like Persephone, this dresser glows with radiant energy. Features built-in LED lighting and a sleek modern design.",
        category_id: bedroom._id, product_type_id: pt_vanity._id,
        dimensions: { length: 80, width: 40, height: 140 }
      },
      // NEW ADDITION: V4
      {
        product_name: "ARLINGTON: Shoe Cabinet with Mirror",
        price: 5990, stock_quantity: 25,
        product_description: "Combines smart functionality with timeless design. Crafted from durable melamine wood with aluminum alloy pulls.",
        category_id: bedroom._id, product_type_id: pt_vanity._id,
        dimensions: { length: 40, width: 33, height: 195 }
      },

      // --- BEDROOM: WARDROBE ---
      {
        product_name: "HESTIA: 4-Door Wardrobe",
        price: 34999, stock_quantity: 10,
        product_description: "Embodying the calm order of Hestia. Crafted from rich Tokyo Oak, it provides generous storage.",
        category_id: bedroom._id, product_type_id: pt_wardrobe._id,
        dimensions: { length: 160, width: 61.1, height: 220 }
      },
      {
        product_name: "THEMIS: Flint Chest of 5 Drawers",
        price: 21499, stock_quantity: 25,
        product_description: "Inspired by Themis. The dark wood-gray tone adds depth, while smooth drawers glide effortlessly.",
        category_id: bedroom._id, product_type_id: pt_wardrobe._id,
        dimensions: { length: 80, width: 44, height: 109 }
      },
      {
        product_name: "SELENE: 3-Door Wardrobe with Drawers",
        price: 28999, stock_quantity: 14,
        product_description: "With the grace of Selene. Illuminates your space with its soft white finish and sleek silhouette.",
        category_id: bedroom._id, product_type_id: pt_wardrobe._id,
        dimensions: { length: 120.5, width: 62, height: 205 }
      },
      // NEW ADDITIONS: W4, W5, W6
      {
        product_name: "BRAMWELL: Open Wardrobe (White)",
        price: 18350, stock_quantity: 15,
        product_description: "The Bramwell Open Wardrobe brings clean simplicity and generous storage into one versatile piece. Built from the durable Pax series foundation.",
        category_id: bedroom._id, product_type_id: pt_wardrobe._id,
        dimensions: { length: 100, width: 58, height: 201 }
      },
      {
        product_name: "HADLEY: Sliding Door Wardrobe (Dark Wood)",
        price: 14995, stock_quantity: 12,
        product_description: "Blends sleek styling with practical everyday function. Crafted from high-grade E1 treated wood, finished in Brownie Oak and Mystery White Marble.",
        category_id: bedroom._id, product_type_id: pt_wardrobe._id,
        dimensions: { length: 120, width: 60, height: 190 }
      },
      {
        product_name: "KENSBURY: 3-Door Wardrobe with Drawers",
        price: 14990, stock_quantity: 20,
        product_description: "Offers a fresh blend of simplicity and ample storage. Built from durable melamine board, MDF, and chipboard with a smooth finish.",
        category_id: bedroom._id, product_type_id: pt_wardrobe._id,
        dimensions: { length: 120, width: 52, height: 190 }
      },

      // --- DINING ROOM: CHAIRS ---
      {
        product_name: "MAGELLAN: Wood Chair",
        price: 4499, stock_quantity: 40,
        product_description: "Inspired by the pioneering spirit of Magellan. Natural wood frame and soft gray fabric.",
        category_id: diningRoom._id, product_type_id: pt_chairs._id,
        dimensions: { length: 47, width: 57, height: 81.5 }
      },
      {
        product_name: "LIVINGSTONE: Stool",
        price: 2299, stock_quantity: 50,
        product_description: "Channeling the resilience of Livingstone. Compact, sturdy, and versatile.",
        category_id: diningRoom._id, product_type_id: pt_chairs._id,
        dimensions: { length: 43, width: 43, height: 41 } 
      },
      {
        product_name: "AMELIA: Cuurv Chair",
        price: 5499, stock_quantity: 30,
        product_description: "Elegant and poised like Amelia Earhart. Blends luxury with practicality using cream upholstery and gold accents.",
        category_id: diningRoom._id, product_type_id: pt_chairs._id,
        dimensions: { length: 54, width: 54, height: 74 }
      },
      // NEW ADDITIONS: C4, C5, C6
      {
        product_name: "LYNDON: Wood Chair (Bahama Style)",
        price: 3990, stock_quantity: 35,
        product_description: "Combines natural warmth with modern durability. Crafted with sturdy iron legs and wrapped in soft linen fabric.",
        category_id: diningRoom._id, product_type_id: pt_chairs._id,
        dimensions: { length: 45, width: 54, height: 68 }
      },
      {
        product_name: "SORELLA: Outdoor Dining Set (White-Beige)",
        price: 8990, stock_quantity: 10,
        product_description: "Crafted from durable PE rattan woven over a sturdy steel frame. Includes tempered glass tabletop.",
        category_id: diningRoom._id, product_type_id: pt_chairs._id,
        dimensions: { length: 60, width: 60, height: 70 }
      },
      {
        product_name: "ALTHEA: Leather Chair",
        price: 3990, stock_quantity: 40,
        product_description: "Exudes elegance and modern sophistication. Featuring a comfortable faux leather cushion and sleek gold-chromed legs.",
        category_id: diningRoom._id, product_type_id: pt_chairs._id,
        dimensions: { length: 56, width: 69, height: 92.5 }
      },

      // --- DINING ROOM: TABLE ---
      {
        product_name: "COLUMBUS: 6-Seater Dining Set",
        price: 28999, stock_quantity: 8,
        product_description: "Inspired by Columbus. Crafted from durable wood with a soft gray finish.",
        category_id: diningRoom._id, product_type_id: pt_table._id,
        dimensions: { length: 150, width: 90, height: 75 }
      },
      {
        product_name: "VESPUCCI: 4-Seater Space Saving Set",
        price: 22499, stock_quantity: 12,
        product_description: "Named after Amerigo Vespucci. Oak-beige finish exudes warmth in a space-saving design.",
        category_id: diningRoom._id, product_type_id: pt_table._id,
        dimensions: { length: 150, width: 90, height: 75 }
      },
      {
        product_name: "COOK: Wood Dining Set (Walnut)",
        price: 35999, stock_quantity: 6,
        product_description: "Honoring Captain James Cook. Rich walnut finish adds sophistication and strength.",
        category_id: diningRoom._id, product_type_id: pt_table._id,
        dimensions: { length: 150, width: 90, height: 75 }
      },
      // NEW ADDITIONS: T4, T5, T6
      {
        product_name: "VALENTE: Marble Dining Table (Black)",
        price: 36990, stock_quantity: 5,
        product_description: "Combines bold sophistication with timeless elegance. Its sleek black marble top exudes luxury.",
        category_id: diningRoom._id, product_type_id: pt_table._id,
        dimensions: { length: 200, width: 100, height: 75 }
      },
      {
        product_name: "MONTCLAIR: Console Table (Walnut)",
        price: 17995, stock_quantity: 15,
        product_description: "Blends refined elegance with practical functionality. Crafted with a rich walnut finish and sleek design.",
        category_id: diningRoom._id, product_type_id: pt_table._id,
        dimensions: { length: 120, width: 40, height: 85 }
      },
      {
        product_name: "LYRA: Nesting Tables (Gold)",
        price: 4990, stock_quantity: 25,
        product_description: "Versatile style with a chic gold chrome frame and wooden tops. Two tables nest together to save space.",
        category_id: diningRoom._id, product_type_id: pt_table._id,
        dimensions: { length: 60, width: 60, height: 45 }
      },

      // --- LIVING ROOM: CENTER TABLE ---
      {
        product_name: "CURIE: Side Table with Storage",
        price: 3899, stock_quantity: 30,
        product_description: "Inspired by Marie Curie. Natural finish and clever storage make it both functional and refined.",
        category_id: livingRoom._id, product_type_id: pt_centerTable._id,
        dimensions: { length: 50, width: 50, height: 50 }
      },
      {
        product_name: "TESLA: Coffee Table (Natural)",
        price: 5499, stock_quantity: 20,
        product_description: "Channeling Nikola Tesla. Features sleek lines and a natural wood finish.",
        category_id: livingRoom._id, product_type_id: pt_centerTable._id,
        dimensions: { length: 100, width: 50, height: 40 }
      },
      {
        product_name: "DA VINCI: Bar Table",
        price: 8999, stock_quantity: 15,
        product_description: "Inspired by Da Vinci’s versatility. Extendable design perfect for entertaining.",
        category_id: livingRoom._id, product_type_id: pt_centerTable._id,
        dimensions: { length: 205, width: 48, height: 104 }
      },
      // NEW ADDITIONS: CT4, CT5, CT6
      {
        product_name: "FAYLEN: 2-Tier Side Table (White)",
        price: 1990, stock_quantity: 40,
        product_description: "Combines modern design with practical storage. Compact size perfect for wet and dry areas.",
        category_id: livingRoom._id, product_type_id: pt_centerTable._id,
        dimensions: { length: 32, width: 32, height: 40 }
      },
      {
        product_name: "REVELLO: Low Cabinet (White/Natural)",
        price: 5990, stock_quantity: 20,
        product_description: "Blends modern simplicity with warm natural tones. Crafted from treated wood and sturdy iron.",
        category_id: livingRoom._id, product_type_id: pt_centerTable._id,
        dimensions: { length: 90, width: 35, height: 60 }
      },
      {
        product_name: "CELINA: Edge Nesting Tables (Marble-Gold)",
        price: 8990, stock_quantity: 15,
        product_description: "Combine luxurious marble tops with sleek gold chrome frames. Versatile and space-saving.",
        category_id: livingRoom._id, product_type_id: pt_centerTable._id,
        dimensions: { length: 50, width: 50, height: 45 }
      },

      // --- LIVING ROOM: SOFA ---
      {
        product_name: "MONET: Symmetry Sofa (Light Green)",
        price: 18999, stock_quantity: 10,
        product_description: "Inspired by Claude Monet. Soft light green upholstery evokes natural tranquility.",
        category_id: livingRoom._id, product_type_id: pt_sofa._id,
        dimensions: { length: 224, width: 80, height: 63 }
      },
      {
        product_name: "HOPPER: Nordic 2-Seater Sofa",
        price: 12499, stock_quantity: 15,
        product_description: "Channeling Edward Hopper’s minimalist artistry. Sleek, understated, and modern off-white finish.",
        category_id: livingRoom._id, product_type_id: pt_sofa._id,
        dimensions: { length: 131, width: 74, height: 78 }
      },
      {
        product_name: "PICASSO: Scate 3-Seater Sofa",
        price: 22999, stock_quantity: 8,
        product_description: "Bold and expressive like Picasso. Stands out with its dynamic design and sturdy construction.",
        category_id: livingRoom._id, product_type_id: pt_sofa._id,
        dimensions: { length: 239, width: 95, height: 71 }
      },
      // NEW ADDITIONS: S4, S5, S6
      {
        product_name: "ELARA: Rocking Chair (White)",
        price: 16990, stock_quantity: 10,
        product_description: "Invites you to unwind in style. Sleek white design and smooth rocking motion.",
        category_id: livingRoom._id, product_type_id: pt_sofa._id,
        dimensions: { length: 93, width: 93, height: 95 }
      },
      {
        product_name: "SOLENA: Quilt Rocker with Ottoman",
        price: 8990, stock_quantity: 12,
        product_description: "Cozy comfort and modern style. Crafted from durable rubber wood and soft teddy fabric.",
        category_id: livingRoom._id, product_type_id: pt_sofa._id,
        dimensions: { length: 64.5, width: 80, height: 87 }
      },
      {
        product_name: "AURELIA: Rattan Sofa (Natural)",
        price: 21990, stock_quantity: 8,
        product_description: "Combines natural charm with elegant design. Crafted from durable ash wood and rattan.",
        category_id: livingRoom._id, product_type_id: pt_sofa._id,
        dimensions: { length: 155, width: 53, height: 72 }
      },
    ]);

    // Destructure Products for easy access
    const [
      hera, demeter, artemis, iris, eos, nyx, // Beds
      athena, aphrodite, persephone, arlington, // Vanity
      hestia, themis, selene, bramwell, hadley, kensbury, // Wardrobe
      magellan, livingstone, amelia, lyndon, sorella, althea, // Chairs
      columbus, vespucci, cook, valente, montclair, lyra, // Tables
      curie, tesla, davinci, faylen, revello, celina, // Center Tables
      monet, hopper, picasso, elara, solena, aurelia // Sofas
    ] = products;

    console.log(`🪑 Created ${products.length} products.`);

    // 8. Create and Link Images
    console.log("🖼️ Creating and linking images...");
    const imagesData = [
      // --- BEDS ---
      { 
        product_id: hera._id, 
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/01/Butter-Mann-Ottoman-Queen-Bed-with-Side-Tables.jpg", 
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/01/Butter-Mann-Ottoman-Bed-with-Side-Tables-1-700x700.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/01/Butter-Mann-Ottoman-Bed-with-Side-Tables-1-700x700.jpg"
      },
      { 
        product_id: demeter._id, 
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/12/Gupee-Luxe-Queen-Bed-Green-min.jpg", 
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/12/Gupee-Luxe-Queen-Bed-Green-6-min-700x700.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/12/Gupee-Luxe-Queen-Bed-Green-7-min-700x700.jpg",
        fourth_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/12/Gupee-Luxe-Queen-Bed-Green-5-min.jpg",
        fifth_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/12/Gupee-Luxe-Queen-Bed-Green-4-min.jpg"
      },
      { 
        product_id: artemis._id, 
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2018/02/At-Home-Sundeburg-Double-Bunk-Bed-3-700x534.jpg", 
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2018/02/Bowen-Bunk-Bed-3-700x700.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2018/02/At-Home-Sundeburg-Double-Bunk-Bed-4.jpg"
      },
      { 
        product_id: iris._id, 
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/01/Barmore-Storage-Bed-White-4-min.jpg", 
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/01/Barmore-Storage-Bed-White-1-min-800x800.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/01/Barmore-Storage-Bed-White-3-min.jpg"
      },
      { 
        product_id: eos._id, 
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/05/IMG_7867-800x800.jpeg", 
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/05/IMG_7861-800x802.jpeg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/05/Studio-Project-8-9-570x570.png"
      },
      { 
        product_id: nyx._id, 
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/01/VALERIE-METAL-WIDE-SINGLE-BED-800x800.jpg", 
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/01/Valerie-Metal-Wide-Single-Bed-Black-1-800x800.jpg"
      },
      
      // --- VANITY ---
      { 
        product_id: athena._id, 
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/10/Marydel-Dressing-Table-60cm-Dark-Wood-1.jpg", 
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/10/Marydel-Dressing-Table-60cm-Dark-Wood-10-700x700.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/10/Marydel-Dressing-Table-60cm-Dark-Wood-8-700x700.jpg",
        fourth_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/10/Marydel-Dressing-Table-60cm-Dark-Wood-6-700x700.jpg",
        fifth_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/10/Marydel-Dressing-Table-60cm-Dark-Wood-9-700x700.jpg"
      },
      { 
        product_id: aphrodite._id, 
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/03/120026400_c_Melbourne_SS_LO.jpg", 
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/03/Melbourne-dressing-5-700x700.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/03/Melbourne-dressing-6-700x700.jpg",
        fourth_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/03/Melbourne-dressing-3-700x700.jpg"
      },
      { 
        product_id: persephone._id, 
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/01/SKAGEN-VANITY-DRESSER-WITH-LIGHTS-700x700.jpg", 
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2021/04/Scandi-Vanity-2-700x700.jpg" 
      },
      {
        product_id: arlington._id,
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/02/JQ5N-A-shoe-cabinet-3.jpg",
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/02/JQ5N-A-shoe-cabinet-1.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/02/JQ5N-A-shoe-cabinet-8-570x570.jpg"
      },

      // --- WARDROBE ---
      { 
        product_id: hestia._id, 
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/03/SHIZUOKA-700x700.jpg", 
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/03/120026226_pc_Shizuoka_TO_SS-700x700.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/03/120026226_op9_Shizuoka_TO_SS-700x700.jpg",
        fourth_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/03/120026226_pf_Shizuoka_TO_SS-700x700.jpg",
        fifth_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/03/120026226_op7_Shizuoka_TO_SS-700x700.jpg"
      },
      { 
        product_id: themis._id, 
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/01/Flint-Chest-of-5-Drawers-Dark-Wood-Gray-1-min.jpg", 
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/01/Flint-Chest-of-5-Drawers-Dark-Wood-Gray-5-min.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/01/Flint-Chest-of-5-Drawers-Dark-Wood-Gray-4-min-700x700.jpg"
      },
      { 
        product_id: selene._id, 
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/07/Karlstad-3-Door-Wardrobe-with-Drawers-White-1-min.jpg", 
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/07/Karlstad-3-Door-Wardrobe-with-Drawers-White-4-700x700.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/07/Karlstad-3-Door-Wardrobe-with-Drawers-White-2-700x700.jpg"
      },
      {
        product_id: bramwell._id,
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/11/Pax-Open-with-Drawers-2.jpg",
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/11/Pax-Open-with-Drawers-1-800x800.jpg"
      },
      {
        product_id: hadley._id,
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/10/Marydel-Sliding-Door-Wardrobe-120-cm-Dark-Wood-1-min.jpg",
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/10/Marydel-Sliding-Door-Wardrobe-120-cm-Dark-Wood-2-min-800x800.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/10/Marydel-Sliding-Door-Wardrobe-120-cm-Dark-Wood-5-min-800x800.jpg",
        fourth_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/10/Marydel-Sliding-Door-Wardrobe-120-cm-Dark-Wood-3-min-570x570.jpg"
      },
      {
        product_id: kensbury._id,
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/07/Songeland-3-Door-Wardrobe-with-Drawers-White-1.jpg",
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/07/Songeland-3-Door-Wardrobe-with-Drawers-White-5-800x800.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/07/Songeland-3-Door-Wardrobe-with-Drawers-White-4-800x800.jpg",
        fourth_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/07/Songeland-3-Door-Wardrobe-with-Drawers-White-3-570x570.jpg"
      },

      // --- CHAIRS ---
      { 
        product_id: magellan._id, 
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/09/Butter-Callstone-Gray-2-700x700.jpg", 
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/09/Butter-Callstone-Gray-4.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/09/Butter-Callstone-Gray-3-700x700.jpg",
        fourth_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/02/Studio-Project-12-4-700x700.png"
      },
      { 
        product_id: livingstone._id, 
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/12/Butter-Mush-Stool-43cm-White-1.jpg", 
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/12/butter-mush-stool-display-1-700x700.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/12/butter-mush-stool-display2-1-700x700.jpg"
      },
      { 
        product_id: amelia._id, 
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/02/Butter-Cuurv-Cream-Gold2Main-700x700.jpg", 
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/02/Butter-Cuurv-Cream-Gold3-700x700.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/02/Butter-Cuurv-Cream-Gold5-700x700.jpg"
      },
      {
        product_id: lyndon._id,
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/10/Bahama-Wood-Chair-1-min.jpg",
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/10/Bahama-Wood-Chair-5-min-570x570.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/10/Bahama-Wood-Chair-4-min-570x570.jpg"
      },
      {
        product_id: sorella._id,
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/04/viber_image_2024-04-06_09-09-55-209.jpg",
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/04/2-min-4.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/04/1-11-800x800.jpg",
        fourth_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/03/Studio-Project-3-15.png"
      },
      {
        product_id: althea._id,
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/03/Kane-Chair-Beige-PU-1-min.jpg",
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/03/Kane-Chair-Beige-PU-2-min-800x800.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/03/Studio-Project-14-3-800x800.png"
      },

      // --- TABLE ---
      { 
        product_id: columbus._id, 
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/09/GRAINS-4-SEATER-SPACE-SAVING-DINING-SET-ROUND-OAKBEIGE-6-scaled.jpg", 
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/09/GRAINS-4-SEATER-SPACE-SAVING-DINING-SET-ROUND-OAKBEIGE-4-700x700.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/09/GRAINS-4-SEATER-SPACE-SAVING-DINING-SET-ROUND-OAKBEIGE-5-700x700.jpg",
        fourth_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/09/GRAINS-4-SEATER-SPACE-SAVING-DINING-SET-ROUND-OAKBEIGE-1-700x700.jpg"
      },
      { 
        product_id: vespucci._id, 
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/09/GRAINS-4-SEATER-SPACE-SAVING-DINING-SET-ROUND-OAKBEIGE-6-scaled.jpg", 
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/09/GRAINS-4-SEATER-SPACE-SAVING-DINING-SET-ROUND-OAKBEIGE-1-scaled.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/09/GRAINS-4-SEATER-SPACE-SAVING-DINING-SET-ROUND-OAKBEIGE-3-700x700.jpg"
      },
      { 
        product_id: cook._id, 
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/02/GRAIN-SPACE-SAVING-RECTANGULAR-DINING-SET-3-700x700.jpg", 
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/02/GRAIN-SPACE-SAVING-DINING-SET-CASE-PICTURE-5-700x700.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/02/GRAIN-SPACE-SAVING-RECTANGULAR-DINING-SET-2-700x700.jpg",
        fourth_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/02/GRAIN-SPACE-SAVING-DINING-SET-GREY-CHAIR-3-1-700x700.jpg",
        fifth_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/02/GRAIN-SPACE-SAVING-DINING-SET-GREY-CHAIR-4-700x700.jpg"
      },
      {
        product_id: valente._id,
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/03/Mazzini-Marble-Dining-Table-200cm-Black-3-min.jpg",
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/03/Mazzini-Marble-Dining-Table-200cm-Black-5-min.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/03/Mazzini-Marble-Dining-Table-200cm-Black-6-min-570x570.jpg",
        fourth_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/03/Mazzini-Marble-Dining-Table-200cm-Black-4-min.jpg"
      },
      {
        product_id: montclair._id,
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2020/01/110028854-Jeager_3.png",
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2020/01/110028854-Jeager_2.png",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2020/01/110028854-Jeager_1.png",
        fourth_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2020/01/110028854-Jeager_4-570x570.png"
      },
      {
        product_id: lyra._id,
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/01/Coles-Nesting-Tables-Gold.jpg"
      },

      // --- CENTER TABLES ---
      { 
        product_id: curie._id, 
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/02/170130906_c_ONITSUKA_M_NTsize-700x700.jpg", 
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/02/170130906_pc_ONITSUKA_M_NT-700x700.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/02/170130906_op1_ONITSUKA_M_NT-700x700.jpg"
      },
      { 
        product_id: tesla._id, 
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/10/Marbosa-Nesting-Tables-1-scaled.jpg" 
      },
      { 
        product_id: davinci._id, 
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/08/BARNES-BAR-TABLE-WHITE-700x700.jpg", 
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2018/02/Barnes-Doily-Bar-Table-700x700.jpg" 
      },
      {
        product_id: faylen._id,
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/08/Combini-2-Layer-WhiteSize.jpg",
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2018/02/1a087551fa0f7adf0db1ce13325957f0a49181424ec0e62e9d70c0ff90ec0e63.jpg"
      },
      {
        product_id: revello._id,
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/06/monimo-1.jpg",
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/06/monimo-2-800x800.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/06/monimo-3.jpg"
      },
      {
        product_id: celina._id,
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/09/25-1.jpg",
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/09/26-1.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/09/27-1-800x800.jpg",
        fourth_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/09/28-1.jpg"
      },

      // --- SOFAS ---
      { 
        product_id: monet._id, 
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/04/viber_image_2024-04-13_14-47-25-261-min-700x700.jpg", 
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/04/Butter-Symmetry-green-2-700x700.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/04/Untitled-2.jpg",
        fourth_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/04/viber_image_2024-04-15_11-11-59-808-700x700.jpg"
      },
      { 
        product_id: hopper._id, 
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2025/03/butter-ichone-1-ball-white-2-700x700.jpg" 
      },
      { 
        product_id: picasso._id, 
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/12/Butter-Scate-2-Seater-Sofa-White.jpg", 
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/12/Butter-Scate-Armchair-Sofa-White-2.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/12/Butter-Scate-Armchair-Sofa-White-1.jpg" 
      },
      {
        product_id: elara._id,
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/08/Pochi-Rocking-Chair-Beige.jpg",
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/08/Pochi-Rocking-Chair-white-1-800x800.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/01/Pochi-Rocking-Chair-White-1-min-800x800.jpg",
        fourth_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2023/01/Pochi-Rocking-Chair-White-2-min-570x570.jpg"
      },
      {
        product_id: solena._id,
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/02/Nordic-Quilt-Rocker-2MainAdjustwhite.jpg",
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/02/Nordic-Quilt-Rocker-1Adjustwhite-800x800.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/02/Nordic-Quilt-Rocker-3Adjustwhite-800x800.jpg",
        fourth_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2024/02/Nordic-Quilt-Rocker-4Adjustwhite.jpg"
      },
      {
        product_id: aurelia._id,
        main_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/10/Chleo-Rattan-Sofa-Natural-Natural-min.jpg",
        secondary_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/10/Chleo-Rattan-Sofa-Natural-Natural-2-min-800x800.jpg",
        third_photo_url: "https://www.furnituresourcephils.com/wp-content/uploads/2022/10/Chleo-Rattan-Sofa-Natural-Natural-1-min-800x800.jpg"
      },
    ];
    
    const createdImages = await Images.insertMany(imagesData);

    // Link images back to products
    for (const img of createdImages) {
      await Product.findByIdAndUpdate(img.product_id, { images_id: img._id });
    }
    console.log(`🖼️ Created ${createdImages.length} image records and linked to products.`);

    // 9. Create Orders
    console.log("📦 Creating orders...");
    const orders = await Order.create([
      { customer_id: user1._id, date_of_order: new Date("2023-11-01T10:00:00Z"), order_status: "Completed" },
      { customer_id: user2._id, date_of_order: new Date("2023-11-02T11:00:00Z"), order_status: "To Ship" },
      { customer_id: user3._id, date_of_order: new Date("2023-11-03T14:00:00Z"), order_status: "To Ship" },
      { customer_id: user1._id, date_of_order: new Date("2023-11-04T09:00:00Z"), order_status: "Pending" },
      { customer_id: user2._id, date_of_order: new Date("2023-10-10T12:00:00Z"), order_status: "Cancelled" },
      { customer_id: user3._id, date_of_order: new Date("2023-10-28T16:00:00Z"), order_status: "To Receive" },
      { customer_id: user1._id, date_of_order: new Date("2023-10-25T16:00:00Z"), order_status: "Completed" },
    ]);
    const [order1, order2, order3, order4, order5, order6, order7] = orders;
    console.log(`📦 Created ${orders.length} orders.`);

    // 10. Create OrderDetails
    console.log("🧾 Creating order details...");
    await OrderDetail.insertMany([
      // Order 1 (Completed) - Bought a Sofa
      { order_id: order1._id, product_id: monet._id, quantity: 1, order_price: monet.price }, 
      // Order 2 (To Ship) - Bought Bed + Wardrobe
      { order_id: order2._id, product_id: hera._id, quantity: 1, order_price: hera.price }, 
      { order_id: order2._id, product_id: hestia._id, quantity: 1, order_price: hestia.price }, 
      // Order 3 (To Ship) - Bought Dining Table + Chairs
      { order_id: order3._id, product_id: columbus._id, quantity: 1, order_price: columbus.price }, 
      { order_id: order3._id, product_id: magellan._id, quantity: 2, order_price: magellan.price }, 
      // Order 4 (Pending) - Bought Vanity
      { order_id: order4._id, product_id: athena._id, quantity: 1, order_price: athena.price }, 
      // Order 5 (Cancelled) - Bought Expensive Table
      { order_id: order5._id, product_id: cook._id, quantity: 1, order_price: cook.price }, 
      // Order 6 (To Receive) - Bought Center Table
      { order_id: order6._id, product_id: davinci._id, quantity: 1, order_price: davinci.price }, 
      // Order 7 (Completed) - Bought Stools
      { order_id: order7._id, product_id: livingstone._id, quantity: 2, order_price: livingstone.price }, 
    ]);
    console.log("🧾 Created order details.");

    // 11. Create Payments
    console.log("💳 Creating payments...");
    await Payment.insertMany([
      { order_id: order1._id, payment_date: new Date("2023-11-01T10:05:00Z"), payment_method: "Credit Card", total_amount: monet.price, payment_status: "Paid" },
      { order_id: order2._id, payment_date: new Date("2023-11-02T11:05:00Z"), payment_method: "Cash on Delivery", total_amount: hera.price + hestia.price, payment_status: "Unpaid" },
      { order_id: order3._id, payment_date: new Date("2023-11-03T14:05:00Z"), payment_method: "GCash", total_amount: columbus.price + (magellan.price * 2), payment_status: "Paid" },
      { order_id: order4._id, payment_date: new Date("2023-11-04T09:05:00Z"), payment_method: "Pending", total_amount: athena.price, payment_status: "Unpaid" },
      { order_id: order5._id, payment_date: new Date("2023-10-10T12:05:00Z"), payment_method: "GCash", total_amount: cook.price, payment_status: "Refunded" },
      { order_id: order6._id, payment_date: new Date("2023-10-28T16:05:00Z"), payment_method: "Credit Card", total_amount: davinci.price, payment_status: "Paid" },
      { order_id: order7._id, payment_date: new Date("2023-10-25T16:05:00Z"), payment_method: "GCash", total_amount: livingstone.price * 2, payment_status: "Paid" },
    ]);
    console.log("💳 Created payment records.");

    // 12. Create Reviews
    console.log("⭐ Creating reviews...");
    await Review.insertMany([
      { product_id: monet._id, customer_id: user1._id, rating: 5, comment: "The green color is beautiful and it's so soft!", review_date: new Date("2023-11-05T10:00:00Z")},
      { product_id: livingstone._id, customer_id: user1._id, rating: 4, comment: "Cute stools, very handy.", review_date: new Date("2023-10-30T10:00:00Z")},
      { product_id: cook._id, customer_id: user2._id, rating: 5, comment: "Walnut finish is premium quality.", review_date: new Date("2023-10-15T10:00:00Z")}, 
      { product_id: hera._id, customer_id: user3._id, rating: 5, comment: "Love the built-in side tables!", review_date: new Date("2023-11-06T10:00:00Z")},
    ]);
    console.log("⭐ Created reviews.");


    console.log("\n✅ --- SEEDING COMPLETE --- ✅\n");

  } catch (error) {
    console.error("❌ --- SEEDING FAILED --- ❌");
    console.error(error);
  } finally {
    // 13. Disconnect from the database
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB.");
  }
};

// Run the seed function
seedDatabase();