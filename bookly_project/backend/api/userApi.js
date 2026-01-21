const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById } = require('../sql/database.js');

//?Összes felhasználó lekérése
router.get('/users', async (req, res) => {
    try {
        const users = await getAllUsers();
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

//?Felhasználó lekérése ID alapján
router.get('/users/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await getUserById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });  
        } 
        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;