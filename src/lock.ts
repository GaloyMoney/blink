
const redis = require('redis')
const Redlock = require('redlock');
  
// the maximum amount of time you want the resource locked,
// keeping in mind that you can extend the lock up until
// the point when it expires
const ttl = 60000;

// if we weren't able to reach redis, your lock will eventually
// expire, but you probably want to do something like log that
// an error occurred; if you don't pass a handler, this error
// will be ignored
function unlockErrorHandler(err) {
  console.error(err);
}

let redlock, client

const getClient = () => {
  client = client ?? redis.createClient(process.env.REDIS_PORT, process.env.REDIS_IP)
  return client
}

const getRedLock = () => {
  if (redlock) { 
    return redlock
  } 
  
  redlock = new Redlock(
  // you should have one client for each independent redis node
  // or cluster
  [getClient()],
  {
    // the expected clock drift; for more details
    // see http://redis.io/topics/distlock
    driftFactor: 0.01, // time in ms

    // the max number of times Redlock will attempt
    // to lock a resource before erroring
    retryCount:  15,

    // the time in ms between attempts
    retryDelay:  250, // time in ms

    // the max time in ms randomly added to retries
    // to improve performance under high contention
    // see https://www.awsarchitectureblog.com/2015/03/backoff.html
    retryJitter:  200 // time in ms
  })

  return redlock
}

export const disposer = (path) => {
  const resource = `locks:account:${path}`;
  return getRedLock().disposer(resource, ttl, unlockErrorHandler)
}

// export const quit = async () => await getRedLock().quit()
// TODO see why above function doesn't work
export const quit = async () => getClient().quit()