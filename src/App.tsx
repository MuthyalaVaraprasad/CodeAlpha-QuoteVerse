import React from 'react';
import { AppContextProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Splash } from './views/Splash';
import { Onboarding } from './views/Onboarding';
import { Login } from './views/Login';
import { Home } from './views/Home';
import { Categories } from './views/Categories';
import { AISmart } from './views/AISmart';
import { Favorites } from './views/Favorites';
import { Profile } from './views/Profile';
import { SearchScreen } from './views/Search';

const AppContent: React.FC = () => {
  const { view, showToast } = useApp();

  // Expose toast alert to window for easy calls inside pure services/views
  (window as any).alertUser = (message: string) => {
    showToast(message, 'success');
  };

  const renderActiveScreen = () => {
    switch (view) {
      case 'splash':
        return <Splash />;
      case 'onboarding':
        return <Onboarding />;
      case 'login':
        return <Login />;
      case 'home':
        return <Home />;
      case 'categories':
        return <Categories />;
      case 'ai_smart':
        return <AISmart />;
      case 'favorites':
        return <Favorites />;
      case 'profile':
        return <Profile />;
      case 'search':
        return <SearchScreen />;
      default:
        return <Home />;
    }
  };

  return <Layout>{renderActiveScreen()}</Layout>;
};

export const App: React.FC = () => {
  return (
    <AppContextProvider>
      <AppContent />
    </AppContextProvider>
  );
};

export default App;
