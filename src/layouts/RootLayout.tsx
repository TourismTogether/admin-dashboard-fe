import React from 'react';
import { Outlet } from 'react-router-dom';

const RootLayout: React.FC = () => {
  return (
    <div className="root-layout">
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default RootLayout;
