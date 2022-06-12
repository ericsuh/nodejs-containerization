# Investigation into signals, subprocesses, and interactions between yarn, node, bash, and tini

This invokes NodeJS scripts in Docker containers using a variety of methods, to see how subprocesses and OS signals are handled.

## Results

| Variation                      | With tini | SIGINT                 | SIGTERM                | has grandchild zombie process |
| ------------------------------ | --------- | ---------------------- | ---------------------- | ----------------------------- |
| yarn run main                  | no        | No response            | Process exited (1)     | yes                           |
| node ./main.js                 | no        | Invoked NodeJS handler | Invoked NodeJS handler | yes                           |
| ./entrypoint.sh yarn run main  | no        | No response            | Process exited (1)     | yes                           |
| ./entrypoint.sh node ./main.js | no        | Invoked NodeJS handler | Invoked NodeJS handler | yes                           |
| ./yarn.sh                      | no        | No response            | No response            | yes                           |
| ./node.sh                      | no        | No response            | No response            | yes                           |
| /bin/sh -c "yarn run main"     | no        | No response            | No response            | yes                           |
| /bin/sh -c "node ./main.js"    | no        | No response            | No response            | yes                           |
| /bin/bash -c "yarn run main"   | no        | No response            | No response            | yes                           |
| /bin/bash -c "node ./main.js"  | no        | Invoked NodeJS handler | Invoked NodeJS handler | yes                           |
| yarn run main                  | yes       | Process exited (130)   | Process exited (1)     | no                            |
| node ./main.js                 | yes       | Invoked NodeJS handler | Invoked NodeJS handler | no                            |
| ./entrypoint.sh yarn run main  | yes       | Process exited (130)   | Process exited (1)     | no                            |
| ./entrypoint.sh node ./main.js | yes       | Invoked NodeJS handler | Invoked NodeJS handler | no                            |
| ./yarn.sh                      | yes       | No response            | Process stopped        | no                            |
| ./node.sh                      | yes       | No response            | Process stopped        | no                            |
| /bin/sh -c "yarn run main"     | yes       | No response            | Process stopped        | no                            |
| /bin/sh -c "node ./main.js"    | yes       | No response            | Process stopped        | no                            |
| /bin/bash -c "yarn run main"   | yes       | No response            | Process stopped        | no                            |
| /bin/bash -c "node ./main.js"  | yes       | Invoked NodeJS handler | Invoked NodeJS handler | no                            |

## Observations

- `tini` (running via `docker run --init`) will help ensure SIGTERM kills a process, but it won't stop issues with signals being swallowed before they hit the Node process.
- If `node` is run without `tini`, then the `grandchild.js` process will stick around in the process table after exiting, because nothing is waiting on its output and closing it (you'll see the output of `ps` show something like `[node] <defunct>`)
- `yarn` as PID 1 does NOT forward signals. `yarn` will respond to SIGTERM directly.
- `sh -c` as PID 1 does NOT forward signals
- `bash -c` as PID 1 forwards signals
- Bash shell scripts without as PID 1 will not forward signals UNLESS node is invoked directly via `exec node ...`
- Child processes do not get signals sent to parent processes

### Best practices

In Dockerfiles:

- Use an init process like `tini`, either via `docker run --init` or by including it in your Dockerfile
- If you need to run a wrapper bash script as your entrypoint, end the script with `exec "$@"` or `exec node.js ./main.js`
- Don't use `yarn run` in your final `ENTRYPOINT`/`CMD` in your Dockerfile
- Don't use `/bin/sh -c` in your final `ENTRYPOINT`/`CMD` in your Dockerfile
- It's ok to use `/bin/bash -c` in your final `ENTRYPOINT` in your Dockerfile, but ONLY if it is the `ENTRYPOINT` (not in a shell script)

When running containers in Kubernetes:

- If you are running pods with containers sharing a process namespace (`shareProcessNamespace: true`), then Kubernetes will use the `pause` container as PID 1, which serves a similar function to `tini`
- If you are not running with shared process namespaces (default for Kubernetes v1.8+), then you should include `tini` in your Dockerfile
