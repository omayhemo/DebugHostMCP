/**
 * Session API Routes
 */

const express = require('express');

module.exports = (sessionManager) => {
  const router = express.Router();
  
  // GET /api/v1/sessions
  router.get('/', async (req, res) => {
    try {
      const sessions = sessionManager.getAllSessions();
      
      res.json({
        success: true,
        data: sessions,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: Date.now()
      });
    }
  });
  
  // DELETE /api/v1/sessions/:id
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await sessionManager.deleteSession(id);
      
      res.json({
        success: true,
        message: 'Session deleted',
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: Date.now()
      });
    }
  });
  
  return router;
};