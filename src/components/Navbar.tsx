import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Grid, Sparkles, Heart, User } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { view, changeView } = useApp();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'categories', label: 'Categories', icon: Grid },
    { id: 'ai_smart', label: 'AI Smart', icon: Sparkles },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  // If view is splash, onboarding or login, do not show bottom navbar
  const hideNavbar = ['splash', 'onboarding', 'login'].includes(view);
  if (hideNavbar) return null;

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        // Check if current view matches the nav item or is a subview of it
        const isActive = view === item.id || 
          (item.id === 'categories' && view.startsWith('category_')) ||
          (item.id === 'ai_smart' && [
            'ai_generator', 'career_coach', 'productivity_coach', 
            'mood_analyzer', 'ai_journal', 'goal_planner', 
            'vision_board', 'quote_explainer', 'personal_feed', 'voice_assistant'
          ].includes(view)) ||
          (item.id === 'favorites' && view === 'collections');

        return (
          <div
            key={item.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => changeView(item.id)}
          >
            <div className="nav-icon-container">
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span>{item.label}</span>
          </div>
        );
      })}
    </nav>
  );
};
export default Navbar;
