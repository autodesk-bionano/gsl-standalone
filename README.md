# gsl-standalone

Standalone GSL server for the Genetic Constructor GSL extension.

## Installation 

* First, install the module dependencies via npm.

 ```npm install```

* If you are running an instance of the server locally, you also need to install fsharp and mono by running the following command from the server's root directory (```gsl-standalone/```). 

 ```npm run install-fsharp```

Alternatively, you could manually install these by following the instructions given for [Mac](http://fsharp.org/use/mac/), [Linux](http://fsharp.org/use/linux/) or [Windows](http://www.mono-project.com/download/#download-win).

* As a part of the postinstall stage of the GSL extension, a [pre-built fork of the GSL repository](https://github.com/autodesk-bionano/Gslc) will be cloned and used by the extension's server to run GSL code. The development fork of the Gslc repository can be found [here](https://github.com/autodesk-bionano/Gslc). You could also install it manually by running the following command from the server's root directory (```gsl-standalone/```). 

 ```npm run install-gsl```

* You could also run it from within a docker container using the given Dockerfile.


## Architecture

As shown below, at a high level, the GSL extension is made up of the following components:

1. The client : Displayed in the project details section of the Genetic constructor.

2. The intermediate (forwarding) server : A lightweight server that simply mediates between the GSL client extension in the browser and the remote external GSL server.

3. The GSL server : The GSL server does the heavy lifting of running the Gslc.exe command and producing output packages available for download. It is located at `https://gsl.dev.bionano.autodesk.com/`

Note: As shown in the diagram by the grey box, this repository includes functionality noted in (3)

![GSL System Diagram](https://cloud.githubusercontent.com/assets/7693347/20854727/1f8afc44-b8ab-11e6-8e9b-26504fd0d236.png)


