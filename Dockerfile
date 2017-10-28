FROM ubuntu:16.04
RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y \
               nodejs npm