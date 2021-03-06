import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import commandExists from 'command-exists';
import mkdirp from 'mkdirp';

import { createProjectFilePath, createProjectFilesDirectoryPath } from './utils/project';
import { preprocessArgs, makeArgumentString, getJsonOutFile } from './utils/command';
import { makeZip, makeZip2, filesCopy, fileWrite } from './utils/fileSystem';
import { argConfig } from './config';

// Path to the GSL repository
const repoName = 'Gslc';
const gslDir = path.resolve(path.join(__dirname, '..', process.env.EXTENSION_DEPLOY_DIR ? process.env.EXTENSION_DEPLOY_DIR : '', repoName));
const gslBinary = path.resolve(gslDir, 'bin/Gslc/Gslc.exe');
const libArg = `--lib ${gslDir}/gslc_lib`;

const router = express.Router();
const jsonParser = bodyParser.json({
  strict: false,
});

/**
 * Route for running GSL programs on the server
 */
router.post('/gslc', jsonParser, (req, res, next) => {
  const input = req.body;
  let content = '';
  if (argConfig.gslFile.hasOwnProperty('preCode')) {
    content += argConfig.gslFile.preCode;
  }

  content += input.code;

  let argumentString = null;
  if (input.hasOwnProperty('arguments')) {
    argumentString = input.arguments;
  }

  // make sure that mono is installed on the server.
  commandExists('mono', (err, commandExists) => {
    if (err || !commandExists) {
      const monoErrorMessage = 'ERROR: Could not find a valid mono installation on the server to run GSL. \n' +
      'Please refer to https://github.com/autodesk-bionano/gc-gsl-editor/blob/master/README.md for server installation instructions. \n' +
      'Alternatively, you could run `npm run install-fsharp` from gsl-standalone/';
      const result = {
        'result': monoErrorMessage,
        'contents': [],
        'status': -1,
      };
      console.log(monoErrorMessage);
      res.status(501).json(result); // Service not implemented
    } else if (!gslDir || !gslBinary || !fs.existsSync(gslDir) || !fs.existsSync(gslBinary)) {
      const errorMessage = 'ERROR: Failed to execute GSL code. \nThe server ' +
      'has not been configured for GSL. \nPlease refer to https://github.com/autodesk-bionano/gc-gsl-editor/blob/master/README.md for ' +
      'server installation instructions. \nAlternatively, you could run `npm run install-gsl` from gsl-standalone';

      console.log(errorMessage);
      console.log(`gslDir: ${gslDir} and gslBinary: ${gslBinary}`);
      console.log(gslDir, gslBinary, fs.existsSync(gslDir), fs.existsSync(gslBinary));

      const result = {
        'result': errorMessage,
        'contents': [],
        'status': -1,
      };
      res.status(501).json(result); // Service not implemented
    } else {
      const modifiedArgs = preprocessArgs(input.projectId, input.extension, input.args);
      const jsonOutFile = getJsonOutFile(modifiedArgs);
      if (!argumentString) {
        argumentString = makeArgumentString(modifiedArgs);
      }
      const projectFileDir = createProjectFilesDirectoryPath(input.projectId, input.extension);
      const filePath = createProjectFilePath(input.projectId, input.extension, argConfig.gslFile.fileName);
      if (!fs.existsSync(projectFileDir)) {
        mkdirp.sync(projectFileDir, function(err) {
          if (err) console.error(err);
          else console.log('Created dir: ' + projectFileDir);
        });
      }

      let output = '';
      // write out a file with the code.
      fs.writeFile(filePath, content, (err) => {
        if (err) {
          console.log(err);
        }
        // execute the code
        const command = `mono ${gslBinary} ${libArg} ${argumentString} ${filePath}`;
        console.log('Running: ', command);

        let process;
        try {
          process = exec(`${command}`, (err, stdout, stderr) => {
            if (err) {
              console.log('Invalid GSL code.');
              console.log(err);
            }
          });
        } catch (ex) {
          console.log('The following exception occured while running the gslc command ', ex);
          const result = {
            'result': 'An exception occured while running the gslc command.',
            'contents': [],
            'status': -1,
          };
          res.status(500).json(result);
        }

        if (process) {
          process.stdout.on('data', (data) => {
            output += data;
          });

          process.stderr.on('data', (data) => {
            output += data;
          });

          // find the exit code of the process.
          process.on('exit', (code) => {
            // mask all server paths
            output = output.replace(new RegExp(projectFileDir, 'g'), '<Server_Path>');
            console.log('Child process exited with an exit code of ', code);
            if (code === 0) {
              fs.readFile(jsonOutFile, 'utf8', (err, contents) => {
                if (err) {
                  res.status(500).send('Error reading the json file.');
                  return;
                }
                const result = {
                  'result': output,
                  'contents': contents,
                  'status': code,
                };
                res.status(200).json(result);
              });

              makePackages(projectFileDir, modifiedArgs);
            } else {
              const result = {
                'result': output,
                'contents': [],
                'status': code,
              };
              res.status(422).json(result);
            }
          });
        }
      });
    }
  });
});

/**
 * Helper function to create the zip packages from the output files.
 */
const makePackages = (projectFileDir, modifiedArgs) => {

  // We need to add file not important for assembly in the auxiliary directory.
  const auxDir = path.join(projectFileDir, 'auxiliary');
  if (!fs.existsSync(auxDir)) {
    mkdirp.sync(auxDir, function(err) {
      if (err) console.error(err);
      else console.log('Created dir: ' + auxDir);
    });
  }

  // Create zip packages.
  Promise.resolve()
  .then(() => {
    if (modifiedArgs.hasOwnProperty('--cm')) {
      makeZip(projectFileDir,
        argConfig.downloadableFileTypes.cm.contentExt,
        argConfig.downloadableFileTypes.cm.fileName)
      .then(() => {
        // Copy the generated file into auxiliary along with the other files
        filesCopy(projectFileDir, argConfig.fileArguments['--cm'].fileExt, auxDir);
      });
    }
    if (modifiedArgs.hasOwnProperty('--ape')) {
      makeZip(projectFileDir,
        argConfig.downloadableFileTypes.ape.contentExt,
        argConfig.downloadableFileTypes.ape.fileName);
    }
    if (modifiedArgs.hasOwnProperty('--thumper')) {
      // create the rabit spreadsheet.
      const inputFile = projectFileDir + '/' + argConfig.fileArguments['--thumper'].fileName + '.rabits.txt';
      const outputFile = projectFileDir + '/' + argConfig.fileArguments['--thumper'].fileName + '.rabits.xls';
      console.log(`Copying ${inputFile} to ${outputFile}`);
      try {
        fs.createReadStream(inputFile).pipe(fs.createWriteStream(outputFile));
      } catch (ex) {
        console.log(`Failed to read ${inputFile} and write to ${outputFile}.`, ex);
      }
      filesCopy(projectFileDir, 'mega.txt|name2id.txt', auxDir);
    }
  })
  .then(() => {
    filesCopy(projectFileDir, 'project.gsl|.xml|gslOut.json', auxDir)
    .then(() => {
    makeZip(projectFileDir,
      argConfig.downloadableFileTypes.allFormats.contentExt,
      argConfig.downloadableFileTypes.allFormats.fileName);
    })
  })
  .catch((ex) => {
    console.log('An error occured while writing all formats', ex);
  });
}

/**
 * Route for downloading any file type.
 * (Should be specified in 'downloadableFileTypes' in config.js)
 */
router.get('/download*', (req, res, next) => {
  if (argConfig.downloadableFileTypes.hasOwnProperty(req.query.type)) {
    const fileName = argConfig.downloadableFileTypes[req.query.type].fileName;
    const filePath = createProjectFilePath(req.query.projectId, req.query.extension, fileName);
    console.log(filePath);
    fs.exists(filePath, (exists) => {
      if (exists) {
        res.header('Content-Type', argConfig.downloadableFileTypes[req.query.type].contentType);
        res.attachment(fileName);
        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
      } else {
        // call the remote server to check if files exist there.
        res.send(`No file of type ${req.query.type} generated yet`);
        res.status(404);
      }
    });
  } else {
    res.send('Could not find an appropriate file type to download.');
    res.status(501);
  }
});

/**
 * Route to list the available file downloads.
 */
router.post('/listDownloads', jsonParser, (req, res, next) => {
  const input = req.body;
  const fileStatus = {};
  const projectFileDir = createProjectFilesDirectoryPath(input.projectId, input.extension);
  Object.keys(argConfig.downloadableFileTypes).forEach((key) => {
    const filePath = projectFileDir + '/' + argConfig.downloadableFileTypes[key].fileName;
    try {
      fs.accessSync(filePath);
      fileStatus[key] = true;
    } catch (err) {
      fileStatus[key] = false;
    }
  });
  res.status(200).json(fileStatus);
});

/**
 * Route to check if GSL, mono, VERSION file exist, and return the VERSION if they do.
 */
router.get('/version', (req, res) => {
  commandExists('mono', (err, commandExists) => {
    var message = '';
    // Check for mono
    if (err || !commandExists) {
      message += 'Could not find mono <br>';
    }
    // Check for GSL directory.
    if (!fs.existsSync(gslDir)) {
      message += 'Could not find GSL directory at ' + gslDir + '<br>';
    }
    if (message !== '') {
      res.status(500);
      res.send(message);
      res.end();
    }
    else {
      try { 
        //this is only relevant when the server builds, so can assume always at same path relative to __dirname
        let version = fs.readFileSync(path.join(__dirname, '../VERSION'), {
          encoding: 'utf8',
        });
        if (version && (version != '')) {
          version = version.replace(/\n/g, '');
        }
        res.status(200);
        res.set('Content-Type', 'text/plain');
        res.send(version);
        res.end();
      } catch (ignored) {
        res.status(404);
        res.send('Missing VERSION file');
        res.end();
      }
    }
  });
});

/**
 * Route for running GSL programs on the server
 */
router.post('/writeRemote', jsonParser, (req, res, next) => {
  const input = req.body;
  const filePath = createProjectFilePath(input.projectId, input.extension, input.fileName);
  fileWrite(filePath, input.contents)
  .then(() => {
    const result = {
      'result': 'Saved.',
      'status': 1,
    };
    res.status(200).json(result);
  })
  .catch((err) => {
    const result = {
      'result': 'Error occured: ' + err,
      'status': -1,
    };
    res.status(500).json(result);
  });
});

module.exports = router;
