/**
 * File-System related helper functions.
 */

const JSZip = require('jszip');
import fs from 'fs';
import path from 'path';

/**
 * JSON parser.
 * @param {string} content
 */
const parser = (string) => {
  if (typeof string !== 'string') {
    return string;
  }
  try {
    return JSON.parse(string);
  } catch (err) {
    console.error(err);
    return {};
  }
};

/**
 * Read a file, optionally parse Json.
 * @param {string} path
 * @param {bool} True, if json should be parsed.
 * @return {string|Object} - Content of the file as a string or JSON Object
 */
export const fileRead = (path, jsonParse = true) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, result) => {
      if (err) {
        if (err.code === 'ENOENT') {
          return reject(err);
        }
        return reject(err);
      }
      const parsed = !!jsonParse ? parser(result) : result;
      resolve(parsed);
    });
  });
};

export const fileExists = (path) => {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        return reject(errorDoesNotExist);
      } else if (!stats.isFile()) {
        console.log('attempting to write file to directory', path);
        return reject(errorFileSystem);
      }
      resolve(path);
    });
  });
};

/**
 * Return the contents of the directory based on a pattern match.
 * @param {string} path
 * @param {string} regex pattern
 * @return {array} items - List of files matching the given regex.
 */
export const directoryContents = (path, pattern = '') => {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, contents) => {
      if (err) {
        return reject(err);
      }
      const reg = new RegExp(pattern);
      resolve(contents.filter((item) => {
        return reg.test(item);
      }));
    });
  });
};

/**
 * Create a zip archive of files.
 * @param {string} directory path
 * @param {string} content extension regex
 * @param {string} zipFileName
 * @return {Object} JSZip object (zip archive)
 */
export const makeZip = (path, contentExt, zipFileName) => {
  return new Promise((resolve, reject) => {
    const zip = new JSZip();
    directoryContents(path, contentExt)
    .then(directoryContents => Promise.all(
      directoryContents.map(fileName => {
        return fileRead(path + '/' + fileName, false).then(fileContents => {
          if (fileName !== 'auxiliary')
            zip.file(fileName, fileContents);
        });
      })
    ))
    .then(() => {
      if (zipFileName === 'gslProjectFiles.zip') {
        return directoryContents(path + '/auxiliary/', 'cx5|json|txt|xml')
      }
      else {
        return [];
      }
    }) 
    .then(innerDirectoryContents => Promise.all(
      innerDirectoryContents.map(innerFileName => {
        return fileRead(path + '/auxiliary/' + innerFileName, false).then(fileContents => {
          console.log('READ ' + innerFileName);
          zip.file('auxiliary/' + innerFileName, fileContents);
        });
      })
    ))
    .then(() => {
      zip.generateNodeStream({type: 'nodebuffer', streamFiles: true})
      .pipe(fs.createWriteStream(path + '/' + zipFileName))
      .on('finish', () => {
        console.log(`Written out ${zipFileName}.`);
        resolve(zip);
      });
    })
    .catch((err) => {
      console.log(`Error making zip file ${zipFileName}`);
      console.log(err.stack);
      reject(err);
    });
  });
};

/**
 * Copy file from source to target path
 * @param {string} source path
 * @param {string} target path
 */
export const fileCopy = (source, target) => {
  return new Promise((resolve, reject) => {
    const rd = fs.createReadStream(source);
    // rd.on('error', reject);
    const wr = fs.createWriteStream(target);
    //wr.on('error', reject);
    wr.on('finish', resolve);
    rd.pipe(wr);
  });
};

/**
 * Create a zip archive of files.
 * @param {string} directory path
 * @param {string} content extension regex
 * @param {string} zipFileName
 * @return {Object} JSZip object (zip archive)
 */
export const filesCopy = (sourcePath, contentExt, target) => {
  return new Promise((resolve, reject) => {
    directoryContents(sourcePath, contentExt)
    .then(directoryContents => {
      directoryContents.map(fileName => {
        fileCopy(path.join(sourcePath, fileName), path.join(target, fileName));
      });
    })
    .then(() => {
      console.log('Copied files to ' + target);
      resolve();
    })
    .catch((err) => {
      console.log(`Error copy files.`);
      console.log(err);
      reject(err);
    });
  });
};
