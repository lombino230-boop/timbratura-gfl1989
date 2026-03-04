const db = require('../utils/db');
const { getDistance } = require('../utils/geo');

const clockIn = async (req, res) => {
    const { lat, lon, note } = req.body;
    const userId = req.user.id;

    try {
        // 1. Check if user is already clocked in
        const activeSession = await db.query(
            "SELECT id FROM work_sessions WHERE user_id = $1 AND status = 'active'",
            [userId]
        );

        if (activeSession.rows.length > 0) {
            return res.status(400).json({ error: 'You are already clocked in' });
        }

        // 2. Validate GPS distance from authorized locations
        const locations = await db.query('SELECT * FROM locations');
        let authorizedLocation = null;

        for (const loc of locations.rows) {
            const distance = getDistance(lat, lon, parseFloat(loc.latitude), parseFloat(loc.longitude));
            if (distance <= loc.radius_meters) {
                authorizedLocation = loc;
                break;
            }
        }

        if (!authorizedLocation) {
            return res.status(403).json({ error: 'You are outside the authorized area' });
        }

        // 3. Create clock-in record
        const result = await db.query(
            `INSERT INTO work_sessions (user_id, location_id, in_time, in_lat, in_lon, in_note, status) 
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5, 'active') 
       RETURNING *`,
            [userId, authorizedLocation.id, lat, lon, note]
        );

        res.status(201).json({ message: 'Clock-in successful', session: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const clockOut = async (req, res) => {
    const { lat, lon, note } = req.body;
    const userId = req.user.id;

    try {
        // 1. Find active session
        const activeSessionResult = await db.query(
            "SELECT id FROM work_sessions WHERE user_id = $1 AND status = 'active' ORDER BY in_time DESC LIMIT 1",
            [userId]
        );

        if (activeSessionResult.rows.length === 0) {
            return res.status(400).json({ error: 'No active session found' });
        }

        const sessionId = activeSessionResult.rows[0].id;

        // 2. Update session with clock-out data
        const result = await db.query(
            `UPDATE work_sessions 
       SET out_time = CURRENT_TIMESTAMP, out_lat = $1, out_lon = $2, out_note = $3, status = 'completed'
       WHERE id = $4 
       RETURNING *`,
            [lat, lon, note, sessionId]
        );

        res.json({ message: 'Clock-out successful', session: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const getHistory = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await db.query(
            'SELECT * FROM work_sessions WHERE user_id = $1 ORDER BY in_time DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
}

module.exports = { clockIn, clockOut, getHistory };
