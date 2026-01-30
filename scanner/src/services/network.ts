import NetInfo from '@react-native-community/netinfo';
import { EventEmitter } from 'events';

class NetworkService extends EventEmitter {
  private _isOnline = false;

  constructor() {
    super();
    NetInfo.addEventListener((state: { isConnected?: boolean | null; isInternetReachable?: boolean | null }) => {
      const online = Boolean(state.isConnected && state.isInternetReachable);
      if (online !== this._isOnline) {
        this._isOnline = online;
        this.emit('change', online);
      }
    });
  }

  isOnline() {
    return this._isOnline;
  }
}

export const networkService = new NetworkService();
