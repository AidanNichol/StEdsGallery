const http =require( "node:http");
const express =require( "express");
var bodyParser = require('body-parser');
var multer = require('multer')
var multiparty = require('multiparty')
const upload = multer({ dest: 'uploads/' })
const app = express();

// create application/x-www-form-urlencoded parser
app.use(bodyParser.urlencoded({extended: false, type:'application/x-www-form-urlencoded'}))

// parse various different custom JSON types as JSON
app.use(bodyParser.json({ type: 'application/json' }))

// parse some custom thing into a Buffer
app.use(bodyParser.raw({ type: 'application/vnd.custom-type' }))

// parse an HTML body into a string
app.use(bodyParser.text({ type: 'text/html' }))
// create application/json parser
var jsonParser = bodyParser.json()

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

// creating routes here
app.get('/', (req, reply) => {
  reply.send({ hello: 'world' })
})
app.get('/apiTestExpress/', (req, reply) => {
  reply.send({ hello: 'world' , version: 3})
})
app.post('/apiTestExpress/',upload.none(), (req, reply) => {

  const body=req.body;
const contentType=req.headers['content-type']

    const now = new Date();
    const headers=JSON.stringify(req.headers)
  reply.send({ hello: 'world' , method:"post", contentType, headers, now, body})
})
app.post('/apiTestExpress/2', (req, reply, next) => {
  const contentType=req.headers['content-type']

    const now = new Date();
    const headers=JSON.stringify(req.headers)
    
    var form = new multiparty.Form();
    var image={};
    var title;
    var fields={}
    
    form.on('error', next);
    form.on('close', function(){
      const uploaded=(`\nuploaded ${image?.filename} (${image.size / 1024 | 0} Kb) as ${title}`);
    reply.send({ hello: 'world' , method:"post", contentType, headers, now, fields,uploaded})
  });

  // listen on field event for title
  form.on('field', function(name, val){
    console.log(`field ${name}: ${val}`)
    fields[name]=val;
    if (name !== 'title') return;
    title = val;
  });

  // listen on part event for image file
  form.on('part', function(part){
    console.log(`name: ${part.name} ${part.filename}`)
    if (!part.filename) return;
    image = {};
    image.filename = part.filename;
    image.size = 0;
    part.on('data', function(buf){
      image.size += buf.length;
    });
  });


  // parse the form
  form.parse(req);
})
app.post('/apiTestExpress/3', (req, reply, next) => {
  const contentType=req.headers['content-type']

    const now = new Date();
    const headers=JSON.stringify(req.headers)
    
    var form = new multiparty.Form({uploadDir:'./temp', autoFields: true, autoFiles:true});
    var image={};
    var title;
    var fields={}
    
  


  // parse the form
  form.parse(req, (err, fields, files) => {
    {Object.keys(fields).forEach(function(name) {
      console.log('got field named ' + name);
    });

    Object.keys(files).forEach(function(name) {
      console.log('got file named ' + name);
    });

    console.log('Upload completed!');}
     reply.send({ hello: 'world' , method:"post", contentType, headers, now, fields,files})
  
});
})
app.post('/apiTestExpress/mpart/',async (req, reply) => {
//   const data = await req.file()
const parts = req.parts();
console.warn('parts', parts);
let fields=[];
for await (const part of parts) {
    if (part.type === 'file') {
        console.warn(`file found ${part.filename}`)
      await pump(part.file, fs.createWriteStream(part.filename))
    } else {
      // part.type === 'field
      console.warn(part)
      fields.push(part)
    }
  }

let data={};
 console.warn('got', data)
 
//   const fields = data?.fields // other parsed parts
  const name=data?.name
  const filename=data?.filename
  const encoding=data?.encoding
  const mimetype=data?.mimetype
  const body={fields, name,filename,encoding,mimetype};

  

//   await pump(data.file, fs.createWriteStream(data.filename))
    const now = new Date();
    const headers=JSON.stringify(req.headers)
  reply.send({ hello: 'world' , method:"post", name, headers, now, body})
})

const httpServer = http.createServer(app);
httpServer.listen({
  port: 7777,
  host: "127.0.0.1",
});