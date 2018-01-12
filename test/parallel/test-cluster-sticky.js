'use strict';
const common = require('../common');
const net = require('net');
const cluster = require('cluster');
const assert = require('assert');

const nbConnectionsPerWorker = 10;

if (cluster.isMaster) {

  cluster.schedulingPolicy = cluster.SCHED_RR;

  let clusterId;
  let nbMessages = 0;
  const nbWorkers = 3;

  for (let i = 0; i < nbWorkers; i++) {
    const worker = cluster.fork({ id: i + 1 });

    worker.on('message', function(msg) {

      // save first worker's id
      // all connections should land to this worker (same IP)
      if (!clusterId) {
        clusterId = this.id;
      } else {
        // check if current worker is the same for the first any connection
        assert.strictEqual(this.id, clusterId);
      }
      nbMessages++;

      // when all connections are done
      if (nbMessages === nbWorkers * nbConnectionsPerWorker) {
        process.exit(0);
      }
    });
  }
} else {
  const server = net.createServer();

  server.on('connection', function(socket) {
    process.send('connection');
  });

  server.on('listening', function() {
    for (let i = 0; i < nbConnectionsPerWorker; i++) {
      net.connect(common.PORT, common.localhostIPv4);
    }
  });

  server.listen(common.PORT, common.localhostIPv4);
}
