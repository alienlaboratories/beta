# Logging

## Loggly

### Javascript

- https://www.loggly.com/docs/javascript

````
<script type="text/javascript" src="//cloudfront.loggly.com/js/loggly.tracker-2.1.min.js" async></script>
<script>
  var _LTracker = _LTracker || [];
  _LTracker.push({
    'logglyKey': 'TOKEN',
    'sendConsoleErrors' : true,
    'tag' : 'loggly-jslogger' 
  });
</script>

_LTracker.push({
  'text': 'Hello World',
  'aList': [9, 2, 5],
  'anObject': {
    'id': 1,
    'value': 'foobar'
  }
});
````

### Node

- https://www.loggly.com/docs/node-js-logs (with winston)

````
import winston from 'winston';
import 'winston-loggly-bulk';

winston.add(winston.transports.Loggly, {
  inputToken: 'b41d441c-3131-4d28-9946-96ee95615221',
  subdomain: 'alienlabs',
  tags: ['Winston-NodeJS'],
  json: true
});

// TODO(burdon): Env, version, etc.
winston.log('info', 'Hello World from Alien.');
````
