const paste = require('../app/paste');

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
        res.render('error', {error: 'Error 400<br>Bad request (no input)'})
        return;
    }

    paste.createPaste(text, password).then((id) => {
        res.redirect(`/${id}`);
    }).catch(() => {
        res.status(500);
        res.render('error', {error: 'Error 500<br>Internal server error.'});
    });
});

/**
 * Reading paste
 */
router.get('/:id', (req, res) => {
    const p = paste.getPaste(req.params.id);
    if (p == false) {
        res.status(500);
        res.render('error', {error: 'Error 500<br>Internal server error.'});
        return;
    }

    if (!p.found) {
        res.status(404);
        res.render('error', {error: 'Error 404<br>Paste not found.'});
        return;
    }
    if (p.encrypted) {
        res.redirect(`/decrypt/${req.params.id}`);
        return;
    }

    res.render('read', {id: req.params.id, text: hljs.highlightAuto(p.data).value, textB64: btoa(encodeURIComponent(p.data)), delTime: p.time_d});
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

    const p = paste.getPaste(req.params.id, password);
    if (p == false) {
        res.status(500);
        res.render('error', {error: 'Error 500<br>Internal server error.'});
        return;
    }

    if (!p.found) {
        res.status(404);
        res.render('error', {error: 'Error 404<br>Paste not found.'});
        return;
    }
    if (!p.encrypted) {
        res.redirect(`/${req.params.id}`);
        return;
    }

    if (p.data == false) {
        res.redirect(`/decrypt/${req.params.id}?wrongpass`);
        return;
    }

    res.render('read', {id: req.params.id, text: hljs.highlightAuto(p.data).value, textB64: btoa(encodeURIComponent(p.data)), delTime: p.time_d});
});

/**
 * Decrypting paste
 */
router.get('/decrypt/:id', (req, res) => {
    const error = req.query.wrongpass != null ? true : false;
    const p = paste.getPaste(req.params.id);
    if (p == false) {
        res.status(500);
        res.render('error', {error: 'Error 500<br>Internal server error.'});
        return;
    }

    if (!p.found) {
        res.status(404);
        res.render('error', {error: 'Error 404<br>Paste not found.'});
        return;
    }

    if (!p.encrypted) {
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
    
    const password = req.get('paste-password') || null;
    const p = paste.getPaste(req.params.id, password);
    if (p == false) {
        res.status(500);
        res.render('error', {error: 'Error 500<br>Internal server error.'});
        return;
    }

    if (!p.found) {
        res.status(404);
        res.send('404 Not Found');
        return;
    }

    if (p.encrypted && p.data == false) {
        res.status(401);
        if (password == null || password.length == 0) {
            res.send(`THIS PASTE IS ENCRYPTED
            \n\nThis app currently offers 2 methods of accessing encrypted files in raw format:
            \nMethod 1:\nYou specify the password in the URL, like this: /raw/${req.params.id}/<password>
            \nMethod 2:\nYou specify the password in a header named "paste-password" (make sure to use the URL without the "/<password>" part)\n`);
            return;
        }

        res.send('Decryption failed. Wrong password?');
        return;
    }

    res.send(p.data);
});

/**
 * Reading encrypted raw paste
 */
router.get('/raw/:id/:password', (req, res) => {
    res.set('Content-Type', 'text/plain');

    const password = req.params.password || null
    if (password == null || password.length == 0) {
        res.status(400);
        res.send('400 - Bad Request (no password)');
        return;
    }
    
    const p = paste.getPaste(req.params.id, password);
    if (p == false) {
        res.status(500);
        res.send('Error 500<br>Internal server error.');
        return;
    }

    if (!p.found) {
        res.status(404);
        res.send('404 Not Found');
        return;
    }

    if (!p.encrypted) {
        res.redirect(`/raw/${req.params.id}`);
        return;
    }

    if (p.data == false) {
        res.status(401);
        res.send('Decryption failed. Wrong password?');
        return;
    }

    res.send(p.data);
});

module.exports = router;