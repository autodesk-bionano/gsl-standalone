# Inherit from ubuntu docker image
FROM ubuntu:14.04

MAINTAINER bionanodevops@autodesk.com # 2016-08-15
ENV CXX g++-4.9
RUN apt-get dist-upgrade -y
RUN apt-get update -y
RUN apt-get upgrade -y

RUN apt-get install -y software-properties-common
RUN add-apt-repository ppa:ubuntu-toolchain-r/test
RUN apt-get update -y

# Explicit set of apt-get commands to workaround issue https://github.com/nodegit/nodegit/issues/886 . Workaround instructions here: http://stackoverflow.com/questions/16605623/where-can-i-get-a-copy-of-the-file-libstdc-so-6-0-15
RUN apt-get install -y curl gcc-4.9 g++-4.9 libstdc++-4.9-dev

RUN apt-get install -y python python-dev python-pip git build-essential wget && \
    curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash - && \
    sudo apt-get -y install nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*


EXPOSE 9876
ENV PORT=9876

RUN mkdir /app
WORKDIR /app

#install fsharp (needed by gslEditor extension if it exists)
#RUN if [ -d ./tools/gslEditor/ ]; then ./extensions/gslEditor/tools/install-fsharp.sh ; fi
ADD ./tools/install-fsharp.sh /app/tools/install-fsharp.sh
RUN ./tools/install-fsharp.sh

#setup node
ADD package.json /app/package.json
RUN npm update -g npm && npm install

ADD . /app
RUN npm install
RUN npm run postinstall

# Start the GSL service
CMD  ["npm" , "run", "start"]
