const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors({
    origin: 'https://speedometer-app-unbox.web.app',  // 
    origin: 'http://localhost:3000', // Allow requests only from this domains
}));


// Database connection   // configure your local mysql to use 
const db = mysql.createConnection({
    host: 'localhost',
    user: 'saish',
    password: 'saish',
    database: 'speed-db',
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Function to delete data older than 10 minutes
const deleteOldData = () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    db.query(
        'DELETE FROM speed_data WHERE timestamp < ?',
        [tenMinutesAgo],
        (err, result) => {
            if (err) {
                console.error('Error deleting old data:', err);
            } else {
                console.log(`Deleted ${result.affectedRows} rows older than 10 minutes.`);
            }
        }
    );
};

// Schedule data deletion every minute
setInterval(deleteOldData, 60 * 1000);

// Endpoint to save GPS speed
app.post('/send-gps-speed', (req, res) => {
    const { speed } = req.body;
    const timestamp = new Date();

    db.query(
        'INSERT INTO speed_data (speed_kph, timestamp) VALUES (?, ?)',
        [speed, timestamp],
        (err) => {
            if (err) {
                console.error('Error inserting data:', err);
                return res.status(500).json({ error: 'Failed to save GPS data' });
            }
            res.json({ message: 'GPS speed data saved successfully' });
        }
    );
});

// Endpoint to retrieve latest GPS data
app.get('/speed', (req, res) => {
    db.query(
        'SELECT speed_kph, timestamp FROM speed_data ORDER BY timestamp DESC LIMIT 1',
        (err, result) => {
            if (err) {
                console.error('Error retrieving data:', err);
                return res.status(500).json({ error: 'Failed to retrieve GPS data' });
            }

            if (result.length === 0) {
                return res.status(404).json({ message: 'No GPS data found' });
            }

            res.json(result[0]);
        }
    );
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
