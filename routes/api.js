const paste = require('../app/paste');

const express = require('express'),
    router = express.Router();

/**
 * Create new paste
 */
router.post('/paste', (req, res) => {
    const text = req.body.text || null;
    const password = req.body.password || null;
    if (text == null || text.length == 0) {
        res.status(400);
        res.json({code: 400, 'error': 'No text received.'});
        return;
    }

    paste.createPaste(text, password).then((id) => {
        res.json({code: 200, 'paste_id': id});
    }).catch(() => {
        res.status(500);
        res.json({code: 500, 'error': 'Internal error.'});
    });
});

module.exports = router;