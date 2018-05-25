const express = require('express');
const serveStatic = require('serve-static');
const path = require('path');
const compression = require('compression');

const app = express();

// compress all responses
app.use(compression());

app.use(serveStatic(path.join(__dirname, 'dist')));
app.listen(3000);
console.log(`Nodejs server is hosting /dist' on port ${3000}`);
