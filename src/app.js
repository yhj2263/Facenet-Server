const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const exec = require('child_process').exec;

const app = express();

app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(fileUpload());
// TODO: check the security of this module
app.use(cors());
// Mount a file server at '/'
app.use(express.static(__dirname + '/../data/test_data'));
console.log('node is running!');

// TODO: refactor this into different services

// Used for checking the working status of the server
app.get('/status', function(req, res) {
    res.send('hello world!');
});

// Used for handling post request to upload file
app.post('/upload_train', function(req, res) {
  // Error 400 if the file is missing
  if (!req.files) {
    return res.status(400).send('No files were uploaded.');
  }

  // Read the file from the post request
  let sampleFile = req.files.sampleFile;
  console.log('uploading ' + sampleFile.name);
  // Use the mv() method to place the uploaded file to the data directory
  sampleFile.mv(__dirname + '/../data/' + sampleFile.name, function(err) {
    // Error 500 if the mv() method fails
    if (err) {
      return res.status(500).send(err);
    }
  });

  console.log('file uploaded!');


  // TODO: The unziped file may contain dummy files, figure out a way to remove
  // Unzip the uploaded file
  console.log('unziping file');
  const childUnzip = exec('unzip ' + __dirname + '/../data/' + sampleFile.name +
  ' -d ' + __dirname + '/../data/train_data',
  function(error, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
  });

  // Used to get rid of the warning
  if (!childUnzip) {}
  res.send('file unzipped!');
});

// Used for handling post request to upload file
app.post('/upload_test', function(req, res) {
  // Error 400 if the file is missing
  if (!req.files) {
    return res.status(400).send('No files were uploaded.');
  }

  // Read the file from the post request
  let sampleFile = req.files.sampleFile;
  console.log('uploading ' + sampleFile.name);
  // Use the mv() method to place the uploaded file to the data directory
  sampleFile.mv(__dirname + '/../data/' + sampleFile.name, function(err) {
    // Error 500 if the mv() method fails
    if (err) {
      return res.status(500).send(err);
    }
  });

  console.log('file uploaded!');


  // TODO: The unziped file may contain dummy files, figure out a way to remove
  // Unzip the uploaded file
  console.log('unziping file');
  const childUnzip = exec('unzip ' + __dirname + '/../data/' + sampleFile.name +
  ' -d ' + __dirname + '/../data/test_data',
  function(error, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
    res.send('file unzipped');
    console.log('file unzipped');
  });

  // Used to get rid of the warning
  if (!childUnzip) {}
});

// Used for handling post request to start training classifier
app.post('/start_train', function(req, res) {
  // Error 400 if the file is missing
  if (!req.body) {
    return res.status(400).send('No files were uploaded.');
  }
  console.log('trainning ' + req.body.classifierName + ' with ' +
    req.body.modelName);
  // console.log(req.body);

  // train the classifier
  let modelName = req.body.modelName;
  let classifierName = req.body.classifierName;
  const childTrain = exec('python '
  + '/root/Facenet/src/classifier.py TRAIN '
  + '/root/Facenet-Server/data/train_data/ '
  + '/root/model/' + modelName + '/' + modelName + '.pb '
  + '/root/Facenet-Server/data/classifier/' + classifierName + '.pkl '
  + '--batch_size 1000',
  function(error, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
    res.send('trainning finished');
  });

  // Used to get rid of the warning
  if (!childTrain) {}
});

// Used for handling post request to start classifying
app.post('/start_classify', function(req, res) {
  // Error 400 if the file is missing
  if (!req.body) {
    return res.status(400).send('No files were uploaded.');
  }
  console.log('classifying ' + ' with ' + req.body.classifierName);

  // classifying with the specified classifier
  let modelName = req.body.modelName;
  let classifierName = req.body.classifierName;
  const childClassify = fork('python '
  + '/root/Facenet/src/classifier.py CLASSIFY '
  + '/root/Facenet-Server/data/test_data/ '
  + '/root/model/' + modelName + '/' + modelName + '.pb '
  + '/root/Facenet-Server/data/classifier/' + classifierName + ' '
  + '--batch_size 1000',
  function(error, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
    console.log('classification finished');
    res.send('classification finished');
  });
  // Used to get rid of the warning
  if (!childClassify) {}
});

// Used to send model information to the front end
app.get('/model', function(req, res) {
  let modelIndex = require('../data/model/index.json');
  res.json(modelIndex);
});

app.get('/classifier', function(req, res) {
  let classifierIndex = require('../data/classifier/index.json');
  res.json(classifierIndex);
});

app.get('/classify_result', function(req, res) {
  let classifyResult = require('../data/result.json');
  res.json(classifyResult);
});

// The server is running on port 8081
app.listen(process.env.PORT || 8081);
