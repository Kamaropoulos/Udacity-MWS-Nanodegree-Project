var express = require('express')
var compression = require('compression');
var minifyHTML = require('express-minify-html');

var app = express()

app.use(minifyHTML({
    override: true,
    exception_url: false,
    htmlMinifier: {
        removeComments: true,
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeAttributeQuotes: true,
        removeEmptyAttributes: true,
        minifyJS: true
    }
}));

app.use(compression());

app.use(express.static('dist'));

app.listen(8000);