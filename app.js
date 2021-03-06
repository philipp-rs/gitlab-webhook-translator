var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

var Config = require('./lib/config');
var log = require('./lib/log');
var Translation = require('./lib/translation');

app.get('/', function (req, res) {
    res.send('Gitlab webhook translator is listening on port 80')
});

app.all(/^\/test\/.*/, function (req, res) {
    log.debug('test url', req.originalUrl);
    log.debug('test headers', req.headers);
    log.debug('test body', req.body);
    res.send();
});

app.post('/', function (req, res) {
    log.info('Hook received from ('+ req.ip +')');

    // Fetch Gitlab token
    var token = req.get('x-gitlab-token');

    // Parse file
    Config.parse(function (config) {

        // Process translations
        var i = 0;
        for (; i < config.translations.length; i++) {
            var translation = config.translations[i];
            Translation.process(translation, req.body, token, function (status, translation) {
                var msg = 'Translation "'+ Translation.getName(translation) +'"';
                if (!status) {log.warn(msg +' did not processed correctly!')} else {log.info(msg +' correctly processed')}
            });
        }
    });
    res.send('Thank you Gitlab, you did great!');
});

app.listen(80, function () {
    log.info('Gitlab webhook translator is listening on port 80');
});

// Check conf
Config.parse(function (config) {
    var msg = 'Your configuration contains '+ config.translations.length +' translations';
    if (config.translations.length === 0) {log.warn(msg)} else {log.info(msg)}
});
