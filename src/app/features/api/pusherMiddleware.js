import Pusher from 'pusher-js';
import { apiSlice } from './apiSlice';

// --- Action Types ---
export const PUSHER_SUBSCRIBE = 'pusher/subscribe';
export const PUSHER_UNSUBSCRIBE = 'pusher/unsubscribe';
export const PUSHER_DISCONNECT = 'pusher/disconnect';

export const PUSHER_CONNECTION_STATE_CHANGED = 'pusher/connectionStateChanged';


// --- Middleware Implementation ---
let pusherClient = null;
let activeChannels = {};

export const pusherMiddleware = (store) => (next) => (action) => {
  // --- Initialize Pusher and Handle Connection State ---
  if (!pusherClient && (action.type === PUSHER_SUBSCRIBE)) {
    try {
      pusherClient = new Pusher(process.env.REACT_APP_PUSHER_KEY, {
        cluster: process.env.REACT_APP_PUSHER_CLUSTER,
        // authEndpoint: '/api/pusher/auth', // For private channels
      });

      console.log('Pusher client initialized.');

      pusherClient.connection.bind('state_change', (states) => {
        const { current: currentState } = states;
        console.log("Pusher connection state changed:", currentState);
        store.dispatch({
          type: PUSHER_CONNECTION_STATE_CHANGED,
          payload: currentState,
        });
      });
    } catch (error) {
      console.error("Failed to initialize Pusher client:", error);
      return next(action);
    }
  }

  // --- Handle Subscribing ---
  if (action.type === PUSHER_SUBSCRIBE) {
    // MODIFIED: Destructure 'events' array instead of 'eventPrefix'
    const { channel: channelName, tag, events } = action.payload;

    // MODIFIED: Updated validation check
    if (!channelName || !tag || !events) {
      console.error('Pusher subscription action is missing `channel`, `tag`, or `events`.', action.payload);
      return next(action);
    }

    if (activeChannels[channelName]) {
      console.warn(`Already subscribed to Pusher channel: ${channelName}. Ignoring action.`);
      return next(action);
    }

    const channel = pusherClient.subscribe(channelName);
    console.log(`Subscribed to Pusher channel: ${channelName}`);

    const invalidateCache = (eventName, data) => {
      console.log(`Pusher event received: '${eventName}' on channel '${channelName}-${tag}'`, data);
      store.dispatch(apiSlice.util.invalidateTags([tag]));
    };
    
    // MODIFIED: Directly use the 'events' array from the payload
    const handlers = {};
    events.forEach(eventName => {
      const handler = (data) => invalidateCache(eventName, data);
      handlers[eventName] = handler;
      channel.bind(eventName, handler);
    });

    activeChannels[channelName] = { channel, handlers };
  }

  // --- Handle Unsubscribing ---
  if (action.type === PUSHER_UNSUBSCRIBE) {
    const { channel: channelName } = action.payload;
    const subscription = activeChannels[channelName];

    if (!subscription) {
      console.warn(`Cannot unsubscribe from Pusher channel: ${channelName}. Not subscribed.`);
      return next(action);
    }

    Object.entries(subscription.handlers).forEach(([eventName, handler]) => {
      subscription.channel.unbind(eventName, handler);
    });

    pusherClient.unsubscribe(channelName);
    console.log(`Unsubscribed from Pusher channel: ${channelName}`);

    delete activeChannels[channelName];
  }

  // --- Handle Disconnecting on Logout ---
  if (action.type === PUSHER_DISCONNECT) {
    if (!pusherClient) {
        return next(action);
    }
    console.log('Disconnecting from Pusher and unsubscribing from all channels.');
    
    Object.keys(activeChannels).forEach(channelName => {
        pusherClient.unsubscribe(channelName);
    });

    pusherClient.disconnect();
    
    activeChannels = {};
    pusherClient = null;
  }

  return next(action);
};

