import { useState, useEffect } from 'react';

const DEFAULT_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJ4QVDvA9fTIQoBUT7DMYuMx4lar18Lu2yQ4F-BA02ETKD3F685obhnMMZ1DTSPgIGtayR6TnhxxI6xPnMhkIfVwIw8pUoiCCKugCt50m261Esqg2-55XI-P4ZSBmpCF6WZeh0zZYF25ixFg1yLaNs5Xysi48cS0GvzZsLD-Z_8zoH7WpKlehQuPAUPWjbyO09MlCOEVrth2zGKWn3MGyHKx3VZmQ2hgrMhzuBmSy6XFRKlRS29CPcZsqDQJ-BLENv8p6ldZ5UsiM';

export function useUserProfile() {
  const [userName, setUserName] = useState(() => localStorage.getItem('user_name') || 'Main Library');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('user_role') || 'Focus Mode Active');
  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem('user_avatar') || DEFAULT_AVATAR);

  useEffect(() => {
    localStorage.setItem('user_name', userName);
    localStorage.setItem('user_role', userRole);
    localStorage.setItem('user_avatar', userAvatar);
  }, [userName, userRole, userAvatar]);

  return { userName, setUserName, userRole, setUserRole, userAvatar, setUserAvatar };
}
