
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const dns = require('dns');
const mongoose = require('mongoose');

dotenv.config();
dns.setServers(['1.1.1.1', '8.8.8.8']);

const authRoutes = require('./routes/authRoutes');

const app = express();
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));

app.use('/api/auth', authRoutes);

app.get('/api/health', (req,res)=>{
  res.json({status:'ok', message:'BarberFlow API Running'});
});

app.get('/', (req,res)=>{
  res.json({message:'BarberFlow Backend Running'});
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>{
  console.log(`Server running on ${PORT}`);
});
