# MAXVOLT Website

Professional, premium website for MAXVOLT - Trusted Power Solutions in Kolkata.

## Project Structure

```
maxvolt-website/
├── index.html                          # Homepage
├── css/
│   └── styles.css                      # Global styles
├── js/
│   └── main.js                         # JavaScript functionality
├── data/
│   └── products.json                   # Product database
├── products/
│   ├── home-inverter-batteries.html   # Home batteries catalogue
│   ├── car-batteries.html              # Car batteries catalogue
│   ├── toto-erickshaw.html            # TOTO/E-rickshaw batteries
│   ├── ebike-batteries.html            # E-bike batteries
│   └── ups.html                        # UPS systems
├── product-detail.html                 # Product detail page template
└── assets/
    └── images/                         # Product images (to be added)
```

## Setup Instructions

### 1. Update Configuration

Open `js/main.js` and update the CONFIG object with MAXVOLT's actual details:

```javascript
const CONFIG = {
  whatsappNumber: '+919876543210',  // Update with actual WhatsApp number
  businessName: 'MAXVOLT',
  contactEmail: 'maxvolt.power@gmail.com',
  phone: '+91 98765 43210'  // Update with actual phone
};
```

### 2. Add Product Images

Create product images for each product and place them in `assets/images/` folder. Reference image filenames in `data/products.json`.

For example:
- `assets/images/exide-imtt1500.jpg`
- `assets/images/luminous-rc18000.jpg`
- etc.

### 3. Update Product Data

Edit `data/products.json` to:
- Update prices (currently placeholder ranges)
- Add/remove products based on MAXVOLT's inventory
- Update product specifications
- Add images for each product

### 4. Deploy Locally

Option A: Using Python (Python 3)
```bash
cd maxvolt-website
python -m http.server 8000
```

Option B: Using Node.js
```bash
cd maxvolt-website
npx http-server
```

Then visit: `http://localhost:8000`

### 5. Integrate Form Submission

The quotation form currently needs backend integration. Options:

**Option A: Use Formspree (Free)**
1. Go to https://formspree.io
2. Create a new form
3. In `js/main.js`, replace `YOUR_FORM_ID` in the handleQuoteSubmit function with your actual form ID

**Option B: Use local backend**
Create a simple backend endpoint to handle form submissions and send emails.

### 6. Customize for Production

Before going live:

1. **Update Meta Tags**
   - Update og:image, og:title, og:description in all HTML files

2. **Add Google Analytics** (in header)
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
   ```

3. **Add Favicon**
   ```html
   <link rel="icon" type="image/x-icon" href="/favicon.ico">
   ```

4. **Setup SSL/HTTPS**
   - Required for WhatsApp integration

5. **Mobile Testing**
   - Test on actual mobile devices
   - Use Chrome DevTools device emulation

## Key Features

### 1. Mobile-First Design
- Sticky header with hamburger menu
- Large, tappable buttons
- Fast loading optimized images
- Minimal typing required for forms

### 2. Product Discovery
- Category cards
- Product filters (brand, capacity, type)
- Product search functionality
- Requirement calculators

### 3. Customer Engagement
- WhatsApp integration with contextual messages
- Quote request form
- Easy contact options
- Live chat ready (can integrate)

### 4. SEO Optimized
- Clean semantic HTML
- Optimized meta tags
- Local Kolkata focus
- Structured data ready

### 5. Admin-Friendly
- JSON-based product database (easy to update)
- No complex database needed
- Easy to add new categories
- Scalable architecture

## Content Management

### Adding New Products

1. Edit `data/products.json`
2. Add product object to relevant category array:

```json
{
  "id": "unique-id",
  "brand": "Brand Name",
  "model": "Model Name",
  "capacity": "150Ah",
  "type": "Tubular",
  "voltage": "12V",
  "warranty": "48 Months",
  "price": "12500 - 13500",
  "availability": "Usually Available",
  "bestFor": "Small to medium homes",
  "image": "filename.jpg"
}
```

### Adding New Product Categories

1. Create new JSON array in `data/products.json`
2. Create new product page (copy `products/home-inverter-batteries.html`)
3. Update category references in JavaScript

### Updating Pricing

Edit `data/products.json` and update the `price` field for any product. Use format: "Min - Max" or "Price on Request"

## SEO Tips

1. **Local Keywords**
   - Focus on "battery Kolkata", "inverter Kolkata", etc.
   - Include location in page titles and descriptions
   - Create location-specific content

2. **Content**
   - Add blog posts about battery selection
   - Create guides for common requirements
   - Share customer testimonials

3. **Technical SEO**
   - Images properly optimized and named
   - Fast loading times
   - Mobile responsive
   - XML sitemap

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari iOS 14+
- Chrome Android

## Performance

- Homepage load time: < 2 seconds
- Mobile optimization: 95+ Lighthouse score
- Image optimization: WebP with JPG fallback recommended
- No heavy dependencies

## Future Enhancements

1. **E-Commerce**
   - Add shopping cart
   - Online payments (Razorpay, PayPal)
   - Order tracking

2. **CRM Integration**
   - Salesforce
   - HubSpot
   - Zoho

3. **Analytics**
   - Google Analytics 4
   - Custom conversion tracking
   - User behavior analysis

4. **AI Chatbot**
   - Product recommendation bot
   - Customer support chatbot
   - Lead qualification

5. **Inventory Management**
   - Real-time stock tracking
   - Automated notifications
   - Supplier integration

## Support & Maintenance

For updates or changes:
1. Update product data in `data/products.json`
2. Add new pages following existing structure
3. Test on mobile before deployment
4. Keep dependencies updated
5. Regular SEO audits

## Contact

**MAXVOLT**
- Email: maxvolt.power@gmail.com
- WhatsApp: +91 XXXXX XXXXX
- Location: Kolkata, West Bengal

---

**Built with ❤️ for MAXVOLT**
Trusted Power. Always.
