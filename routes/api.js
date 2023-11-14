const app = require("../app");

const express = require('express'),
    router = express.Router();

router.post('/paste', (req, res) => {
    const text = req.body.text || null;
    if (text == null || text.length == 0) {
        res.status(400);
        res.json({code: 400, "error": "No text received."});
        return;
    }

    app.createPaste(text).then((id) => {
        res.json({code: 200, "paste_id": id});
    }).catch(() => {
        res.status(500);
        res.json({code: 500, "error": "Internal error."});
    });
});

module.exports = router;