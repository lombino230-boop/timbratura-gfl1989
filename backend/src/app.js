const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const apiRoutes = require('./routes/api');

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Main route
app.get('/', (req, res) => {
    res.json({ message: 'Time GFL API is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
