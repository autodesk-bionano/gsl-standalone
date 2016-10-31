import express from 'express';
import morgan from 'morgan';

const app = express();

require( 'console-stamp' )( console, { pattern : 'dd/mm/yyyy HH:MM:ss.l' } );
app.use(morgan(':date[clf] :method :url :status :response-time ms - :res[content-length]'));

app.use('/', require('./router'));

app.get('/', function(req, res) {
  res.send('Autodesk GSL service');
});

const port = process.env.PORT || process.argv[2] || 9876;

app.listen(port, function() {
  console.log('GSL server listening on port ' + port);
});
