import React,{useState} from 'react';
import LoginScreen from './LoginScreen';
import EventSelectScreen from './EventSelectScreen';
import ScannerScreen from './ScannerScreen';
import SyncStatusScreen from './SyncStatusScreen';
import { initDb } from '../offline-db/db';

export type RouteName = 'Login' | 'EventSelect' | 'Scanner' | 'SyncStatus';

type Nav = {
  replace: (route: RouteName) => void;
  goBack: () => void;
};

type ScreenProps = { navigation: Nav ,};

export default function Root() {
  const [route, setRoute] = useState <RouteName>('Login');

  const navigation: Nav = {
    replace: (r) => setRoute(r),
    goBack: () => setRoute('EventSelect'), // o la pantalla anterior
  };

  React.useEffect(() => { initDb(); }, []);

  if (route === 'Login') return <LoginScreen navigation={navigation as any as ScreenProps['navigation']} />;
  if (route === 'EventSelect') return <EventSelectScreen navigation={navigation as any as ScreenProps['navigation']} />;
  if (route === 'Scanner')
    return <ScannerScreen navigation={navigation} />;
  return <SyncStatusScreen />;
}
