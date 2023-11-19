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
    const password = req.body.password || null;
    if (text == null || text.length == 0) {
        res.status(400);
        res.render('error', {error: "Error 400<br>Bad request (no input)"})
        return;
    }

    app.createPaste(text, password).then((id) => {
        res.redirect(`/${id}`);
    }).catch(() => {
        res.status(500);
        res.render('error', {error: "Error 500<br>Internal server error."});
    });
});

/**
 * Reading paste
 */
router.get('/:id', (req, res) => {
    const paste = app.getPaste(req.params.id);
    if (paste == false) {
        res.status(500);
        res.render('error', {error: "Error 500<br>Internal server error."});
        return;
    }

    if (!paste.found) {
        res.status(404);
        res.render('error', {error: "Error 404<br>Paste not found."});
        return;
    }
    if (paste.encrypted) {
        res.redirect(`/decrypt/${req.params.id}`);
        return;
    }

    const delTime = app.getTimeUntilDeletion(req.params.id);

    res.render('read', {id: req.params.id, text: hljs.highlightAuto(paste.data).value, textB64: btoa(paste.data), delTime});
});

/**
 * Reading encrypted paste
 */
router.post('/:id', (req, res) => {
    const password = req.body.password || null;
    if (password == null || password.length == 0) {
        res.redirect(`/decrypt/${req.params.id}?wrongpass`);
        return;
    }

    const paste = app.getPaste(req.params.id, password);
    if (paste == false) {
        res.status(500);
        res.render('error', {error: "Error 500<br>Internal server error."});
        return;
    }

    if (!paste.found) {
        res.status(404);
        res.render('error', {error: "Error 404<br>Paste not found."});
        return;
    }
    if (!paste.encrypted) {
        res.redirect(`/${req.params.id}`);
        return;
    }

    if (paste.data == false) {
        res.redirect(`/decrypt/${req.params.id}?wrongpass`);
        return;
    }

    const delTime = app.getTimeUntilDeletion(req.params.id);

    res.render('read', {id: req.params.id, text: hljs.highlightAuto(paste.data).value, delTime});
});

/**
 * Decrypting paste
 */
router.get('/decrypt/:id', (req, res) => {
    const error = req.query.wrongpass != null ? true : false;
    const paste = app.getPaste(req.params.id);
    if (paste == false) {
        res.status(500);
        res.render('error', {error: "Error 500<br>Internal server error."});
        return;
    }

    if (!paste.found) {
        res.status(404);
        res.render('error', {error: "Error 404<br>Paste not found."});
        return;
    }

    if (!paste.encrypted) {
        res.redirect(`/${req.params.id}`);
        return;
    }

    res.render('decrypt', {id: req.params.id, error});
});

/**
 * Reading raw paste
 */
router.get('/raw/:id', (req, res) => {
    res.set('Content-Type', 'text/plain');
    const paste = app.getPaste(req.params.id);
    if (paste == false) {
        res.status(500);
        res.render('error', {error: "Error 500<br>Internal server error."});
        return;
    }

    if (!paste.found) {
        res.status(404);
        res.send("404 Not Found");
        return;
    }

    if (paste.encrypted) {
        res.status(401);
        res.send(`This paste is encrypted. To show raw encrypted paste, you need to pass the password in the URL. Format: /raw/${req.params.id}/<password>`);
        return;
    }

    res.send(paste.data);
});

/**
 * Reading encrypted raw paste
 */
router.get('/raw/:id/:password', (req, res) => {
    res.set('Content-Type', 'text/plain');

    const password = req.params.password || null
    if (password == null || password.length == 0) {
        res.status(400);
        res.send("400 - Bad Request (no password)");
        return;
    }
    
    const paste = app.getPaste(req.params.id, password);
    if (paste == false) {
        res.status(500);
        res.send("Error 500<br>Internal server error.");
        return;
    }

    if (!paste.found) {
        res.status(404);
        res.send("404 Not Found");
        return;
    }

    if (!paste.encrypted) {
        res.redirect(`/raw/${req.params.id}`);
        return;
    }

    if (paste.data == false) {
        res.status(401);
        res.send("Decryption failed. Wrong password?");
        return;
    }

    res.send(paste.data);
});

module.exports = router;