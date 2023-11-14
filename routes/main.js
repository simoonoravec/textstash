const app = require("../app");

const express = require('express'),
    router = express.Router();

const hljs = require('highlight.js');

/**
 * Home page
 */
router.get('/', (req, res) => {
    res.render('index');
});

/**
 * Pasting from home page without JavaScript enabled
 */
router.post('/paste', (req, res) => {
    const text = req.body.text || null;
    if (text == null || text.length == 0) {
        res.status(400);
        res.send("400 - Bad request (no text received)")
        return;
    }

    app.createPaste(text).then((id) => {
        res.redirect(`/${id}`);
    }).catch(() => {
        res.status(500);
        res.send("500 - Internal error")
    });
});

/**
 * Reading paste
 */
router.get('/:id', (req, res) => {
    const paste = app.getPaste(req.params.id);
    if (paste == false) {
        res.status(404);
        res.send("404 Not Found");
        return;
    }

    res.render('read', {id: req.params.id, text: hljs.highlightAuto(paste).value});
});

/**
 * Reading raw paste
 */
router.get('/raw/:id', (req, res) => {
    res.set('Content-Type', 'text/plain');
    
    const paste = app.getPaste(req.params.id);
    if (paste == false) {
        res.status(404);
        res.send("404 Not Found");
        return;
    }

    res.send(paste);
});

module.exports = router;