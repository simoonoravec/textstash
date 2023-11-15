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
        res.render('error', {error: "Error 400<br>Bad request (no input)"})
        return;
    }

    app.createPaste(text).then((id) => {
        res.redirect(`/${id}`);
    }).catch(() => {
        res.status(500);
        res.render('error', {error: "Error 500<br>Internal server error."})
    });
});

/**
 * Reading paste
 */
router.get('/:id', (req, res) => {
    if (!app.pasteExists(req.params.id)) {
        res.status(404);
        res.render('error', {error: "Error 404<br>Paste not found."});
        return;
    }

    if (app.pasteExistsEncrypted(req.params.id)) {
        res.redirect(`/decrypt/${req.params.id}`);
        return;
    }

    const paste = app.getPaste(req.params.id);

    res.render('read', {id: req.params.id, text: hljs.highlightAuto(paste).value});
});

/**
 * Reading encrypted paste
 */
router.post('/:id', (req, res) => {
    const existsEncrypted = app.pasteExistsEncrypted(req.params.id);

    if (app.pasteExists(req.params.id) && !existsEncrypted) {
        res.redirect(`/${req.params.id}`);
        return;
    }

    if (!existsEncrypted) {
        res.status(404);
        res.render('error', {error: "Error 404<br>Paste not found."});
        return;
    }

    if (req.body.password.length == 0) {
        res.redirect(`/decrypt/${req.params.id}?wrongpass`);
        return;
    }

    const paste = app.getPasteEncrypted(req.params.id, req.body.password);
    if (paste == false) {
        res.redirect(`/decrypt/${req.params.id}?wrongpass`);
        return;
    }

    res.render('read', {id: req.params.id, text: hljs.highlightAuto(paste).value});
});

/**
 * Decrypting paste
 */
router.get('/decrypt/:id', (req, res) => {
    const error = req.query.wrongpass != null ? true : false;

    res.render('decrypt', {id: req.params.id, error});
});

/**
 * Reading raw paste
 */
router.get('/raw/:id', (req, res) => {
    res.set('Content-Type', 'text/plain');

    if (!app.pasteExists(req.params.id)) {
        res.status(404);
        res.send("404 Not Found");
        return;
    }

    if (app.pasteExistsEncrypted(req.params.id)) {
        res.status(401);
        res.send(`This paste is encrypted. To show raw encrypted paste, you need to pass the password in the URL. Format: /raw/${req.params.id}/<password>`);
        return;
    }
    
    const paste = app.getPaste(req.params.id);

    res.send(paste);
});

/**
 * Reading encrypted raw paste
 */
router.get('/raw/:id/:password', (req, res) => {
    res.set('Content-Type', 'text/plain');

    if (!app.pasteExistsEncrypted(req.params.id)) {
        res.status(404);
        res.send("404 Not Found");
        return;
    }

    if (req.params.password.length == 0) {
        res.status(400);
        res.send("400 - Bad Request (no password)");
        return;
    }
    
    const paste = app.getPasteEncrypted(req.params.id, req.params.password);

    if (paste == false) {
        res.status(401);
        res.send("Decryption failed. Wrong password?");
        return;
    }

    res.send(paste);
});

module.exports = router;