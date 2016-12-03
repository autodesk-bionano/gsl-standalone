export const argConfig = {
  'fileArguments': {
    '--flat': {
      'arguments': ['<filePath>'],
      'fileName': 'gslOutFlat.txt',
    },
    '--json': {
      'arguments': [ '<filePath>' ],
      'fileName': 'gslOut.json',
    },
    '--ape': {
      'arguments': [ '<outDir>', '<prefix>' ],
      'fileName': 'gslOut',
      'fileExt': '.ape',
    },
    '--cm': {
      'arguments': [ '<outDir>', '<prefix>'],
      'fileName': 'gslOut',
      'fileExt': '.cx5',
    },
    '--primers': {
      'arguments': ['<filePath>'],
      'fileName': 'gslOut.primers.txt',
    },
    '--docstring': {
      'arguments': ['<filePath>'],
      'fileName': 'gslOut.doc',
    },
    '--name2id': {
      'arguments': ['<filePath>'],
      'fileName': 'gslOut.name2id.txt',
    },
    '--thumper': {
      'arguments': ['<filePath>'],
      'fileName': 'thumperOut',
    },
  },
  'gslFile': {
    'fileName': 'project.run.gsl',
    'preCode': '',
  },
  'downloadableFileTypes': {
    'ape': {
      'fileName': 'gslOutApe.zip',
      'contentType': 'application/zip',
      'contentExt': ['*.ape'],
    },
    'cm': {
      'fileName': 'gslOutCm.zip',
      'contentType': 'application/zip',
      'contentExt': ['*.cx5'],
    },
    'thumper': {
      'fileName': 'gslOutThumper.zip',
      'contentType': 'application/zip',
      'contentExt': ['thumperOut*'],
    },
    'gsl': {
      'fileName': 'project.gsl',
      'contentType': 'text/plain',
      'contentExt': ['*.gsl'],
    },
    'json': {
      'fileName': 'gslOut.json',
      'contentType': 'application/json',
      'contentExt': ['*.json'],
    },
    'flat': {
      'fileName': 'gslOutFlat.txt',
      'contentType': 'text/plain',
      'contentExt': ['*.txt'],
    },
    'rabitXls': {
      'fileName': 'thumperOut.rabits.xls',
      'contentType': 'application/vnd.ms-excel',
      'contentExt': ['*.xls'],
    },
    'allFormats': {
      'fileName': 'gslProjectFiles.zip',
      'contentType': 'application/zip',
      'contentExt': ['auxiliary/*', '*rabits.txt', '*stitches.txt', '*.xls', '*Flat.txt', '*.ape', '*primers.txt'],
    },
  },
};
