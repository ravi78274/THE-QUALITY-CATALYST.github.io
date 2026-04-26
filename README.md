# M/S The Quality Catalyst — Website v2.0

Complete business website rebuilt from the company's introduction document.

---

## 📁 File Structure

```
tqc-website/
├── index.html            ← Home (Slider + Feature Boxes + Stats)
├── about.html            ← About (Vision, Mission, 5-Phase Approach, Clients)
├── services.html         ← All Services (Expandable Cards + Full Service Catalog)
├── contact.html          ← Contact Form (saves to MongoDB)
├── admin-login.html      ← Hidden Admin Login (not linked on site)
├── admin-dashboard.html  ← Protected Admin Dashboard
├── style.css             ← All Styles (responsive)
├── main.js               ← Frontend JS
├── server.js             ← Node.js + Express + MongoDB Backend
├── package.json
├── images/
│   ├── logo.jpeg         ← Company logo (from document)
│   ├── about-img.png     ← About section image
│   ├── slide1.png        ← Slider background 1
│   ├── slide2.png        ← Slider background 2
│   ├── slide3.png        ← Slider background 3
│   └── consulting-process.png  ← Consulting procedure diagram
```

---

## 🚀 Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Start MongoDB (local)
```bash
mongod
```
Or use MongoDB Atlas (see below).

### 3. Run the server
```bash
node server.js
# or with auto-reload:
npx nodemon server.js
```

### 4. Open the website
```
http://localhost:3000
```

---

## 🔐 Admin Access (Hidden — not linked on site)

```
URL:       http://localhost:3000/admin-login.html
Username:  admin
Password:  admin123
```

---

## ☁️ MongoDB Atlas

```bash
MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/tqc" node server.js
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contact` | Save enquiry |
| GET | `/api/contact` | Fetch all enquiries |
| DELETE | `/api/contact/:id` | Delete enquiry |

---

## ✅ What's Included (from Document)

- ✅ Real company logo and images from the document
- ✅ Consulting procedure diagram
- ✅ Real contact details (both offices, phone, email)
- ✅ All premium clients listed
- ✅ Complete service catalog (60+ services across categories)
- ✅ VAPT, Special Audit, IS Audit services
- ✅ Business Excellence services (Six Sigma, TPM, etc.)
- ✅ Vision, Mission, Strategy from the document
- ✅ 5-phase consulting approach
- ✅ Fully responsive (mobile / tablet / desktop)
- ✅ Smooth slider with real slide images
- ✅ Services accordion (one at a time)
- ✅ Red hover effects on all cards
- ✅ MongoDB backend + Admin dashboard
