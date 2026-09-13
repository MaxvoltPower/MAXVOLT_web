# MAXVOLT Website - Quick Start Guide

Welcome! This guide will help you get your professional MAXVOLT website up and running in 15 minutes.

## What You're Getting

✅ **Professional Website** - Clean, modern, premium design
✅ **Mobile-Optimized** - Works perfectly on all devices  
✅ **Product Catalogue** - 5 main product categories
✅ **Lead Generation** - Quote forms, WhatsApp integration
✅ **No Coding Required** - Easy to update via JSON files
✅ **Fast & Secure** - Optimized for speed and safety

---

## Step 1: Customize Your Contact Information (5 min)

### Update WhatsApp & Phone

1. Open `js/main.js`
2. Find this section (around line 10):
   ```javascript
   const CONFIG = {
     whatsappNumber: '919876543210',  // ← Update this
     phone: '+91 98765 43210'         // ← And this
   };
   ```
3. Replace with your actual numbers
4. Save the file

### Update Email

1. Open `index.html`
2. Search for `maxvolt.power@gmail.com`
3. Replace with your actual email
4. Do the same in other pages

---

## Step 2: Add Product Images (5 min)

1. Create product images (1200×800px recommended)
2. Save as JPG or PNG
3. Place in: `assets/images/`
4. Name them exactly as in `data/products.json`

Example:
- `exide-imtt1500.jpg`
- `luminous-rc18000.jpg`

> 💡 **Tip:** Use free tools like Canva or remove.bg to create/edit images

---

## Step 3: Update Product Data (5 min)

1. Open `data/products.json`
2. Update prices, models, and descriptions
3. Add new products or remove ones you don't sell
4. Save the file

### Example Product Format:
```json
{
  "id": "exide-imtt1500",
  "brand": "Exide",
  "model": "InvaMaster IMTT1500",
  "capacity": "150Ah",
  "type": "Tubular",
  "voltage": "12V",
  "warranty": "48 Months",
  "price": "12500 - 13500",
  "availability": "Usually Available",
  "bestFor": "Small to medium homes",
  "image": "exide-imtt1500.jpg"
}
```

---

## Step 4: Test Locally (Optional)

### Using Python (Recommended):
```bash
# Navigate to maxvolt-website folder
cd maxvolt-website

# Start local server
python -m http.server 8000

# Open in browser
# http://localhost:8000
```

### Using Node.js:
```bash
cd maxvolt-website
npx http-server
```

---

## Step 5: Deploy to Web (10 min)

### Option A: Shared Hosting (Easiest)

1. **Get Hosting**
   - Hostinger (₹200-400/month)
   - SiteGround ($2.99-7.99/month)
   - Or any provider with FTP access

2. **Upload Files**
   - Connect via FTP client (FileZilla, WinSCP)
   - Upload entire `maxvolt-website` folder
   - Make sure `index.html` is in root

3. **Point Domain**
   - Update DNS records in domain registrar
   - Wait 24-48 hours for propagation

### Option B: Free & Easy (Netlify)

1. **Push to GitHub**
   - Upload maxvolt-website to GitHub
   - Create public repository

2. **Deploy on Netlify**
   - Go to netlify.com
   - Click "New site from Git"
   - Connect your GitHub
   - Deploy! 🚀

3. **Free Domain**
   - Get `yourname.netlify.app`
   - Custom domain available (₹400-800/year)

---

## How to Manage Your Website

### Add New Product
1. Edit `data/products.json`
2. Add new product object to category array
3. Add product image to `assets/images/`
4. Website updates automatically!

### Change Prices
1. Open `data/products.json`
2. Update `price` field
3. Save and refresh website

### Update Contact Info
1. Open `js/main.js`
2. Update CONFIG object
3. Also update in all HTML files

### Add New Category
1. Create new JSON array in `data/products.json`
2. Create new HTML page (copy existing one)
3. Update navigation links

---

## Testing Your Website

### Mobile Test
1. Open on iPhone and Android
2. Test WhatsApp buttons
3. Try submitting quote form
4. Check loading speed

### Browser Test
- Chrome ✅
- Firefox ✅
- Safari ✅
- Edge ✅

### Feature Test
- [ ] Hero section displays correctly
- [ ] Category cards visible
- [ ] Product filters work
- [ ] WhatsApp integration active
- [ ] Quote form submits
- [ ] Mobile menu hamburger works
- [ ] All images load
- [ ] Links navigate correctly

---

## Monitoring & Updates

### Monthly Tasks
1. Update product prices
2. Review analytics
3. Respond to inquiries
4. Add new products

### Quarterly Tasks
1. Add customer testimonials
2. Update product descriptions
3. Review SEO performance
4. Check website speed

---

## Common Questions

**Q: How do I accept online payments?**
A: Currently, the site focuses on quotes. Add payment later via Razorpay or PayPal.

**Q: Can I change the design?**
A: Yes! Edit `css/styles.css`. Or contact a developer for custom changes.

**Q: How do I get more traffic?**
A: Use Google Ads, local SEO, and social media. See DEPLOYMENT.md for details.

**Q: Can I add a blog?**
A: Yes! Create blog pages following the same structure.

**Q: What if something breaks?**
A: Check DEPLOYMENT.md troubleshooting section. Most issues are simple fixes.

---

## Quick Links

| Document | Purpose |
|----------|---------|
| SETUP.md | Detailed technical setup |
| DEPLOYMENT.md | Full deployment guide |
| config.json | Business configuration |
| products.json | Product database |
| styles.css | Design customization |

---

## Next Steps

1. ✅ Update contact information
2. ✅ Add product images
3. ✅ Update product data
4. ✅ Deploy website
5. ✅ Test everything
6. ✅ Promote on social media
7. ✅ Monitor and optimize

---

## Support Resources

**Need Help?**
1. Read SETUP.md for detailed instructions
2. Check DEPLOYMENT.md for hosting help
3. Review code comments in HTML/CSS/JS files
4. Test in different browsers

**Stuck?**
- Try reloading the page
- Clear browser cache
- Check file names match exactly
- Verify JSON syntax is correct
- Check WhatsApp number format

---

## You're Ready! 🎉

Your professional MAXVOLT website is now live!

**Remember:**
- Keep contact info updated
- Add new products regularly
- Monitor customer inquiries
- Respond quickly on WhatsApp
- Gather customer feedback

---

**MAXVOLT - Trusted Power Always** ⚡

Questions? Contact your developer or refer to the documentation files.

---

## Timeline

| Task | Time | Status |
|------|------|--------|
| Customize contact | 5 min | ⏳ |
| Add images | 5 min | ⏳ |
| Update products | 5 min | ⏳ |
| Test locally | 5 min | ⏳ |
| Deploy online | 10 min | ⏳ |
| **Total** | **30 min** | **Start now!** |

---

**Built with ❤️ for MAXVOLT**

Let's power India's future! 🔋⚡
