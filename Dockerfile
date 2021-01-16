FROM node:12

COPY "./package.json" "./tsconfig.json" "./yarn.lock" ./

RUN cd functions \
&& yarn install

COPY  "./src/" "./src/"

COPY "./*.js" "./"
COPY "./.env" "./.env"

CMD sleep infinity