const { EventEmitter, once } = require('events');

const events = new EventEmitter();
events.setMaxListeners(0);
events.at = (eventName) => once(events, eventName);

module.exports = events;
