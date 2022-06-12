FROM node:18 AS base
WORKDIR /
COPY package.json *.js *.sh ./

FROM base AS yarn
CMD ["yarn", "run", "main"]

FROM base AS node
CMD ["node", "./main.js"]

# Bash exec-ing

FROM base AS execbase
ENTRYPOINT ["/entrypoint.sh"]

FROM execbase AS execyarn
CMD ["yarn", "run", "main"]

FROM execbase AS execnode
CMD ["node", "./main.js"]

# Bash invoking subprocesses

FROM base AS yarnsh
ENTRYPOINT ["/yarn.sh"]

FROM base AS nodesh
ENTRYPOINT ["/node.sh"]

# /bin/sh -c

FROM base AS shcbase
ENTRYPOINT ["/bin/sh", "-c"]

FROM shcbase AS shcyarn
CMD ["yarn run main"]

FROM shcbase AS shcnode
CMD ["node ./main.js"]

# /bin/bash -c

FROM base AS bashcbase
ENTRYPOINT ["/bin/bash", "-c"]

FROM bashcbase AS bashcyarn
CMD ["yarn run main"]

FROM bashcbase AS bashcnode
CMD ["node ./main.js"]
