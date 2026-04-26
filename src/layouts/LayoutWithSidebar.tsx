import React from "react";
import { Sidebar } from "../components/Sidebar";
import { Layout } from "./Layout";

interface LayoutWithSidebarProps {
  children: React.ReactNode;
  /** Sidebar */
  activeItem?: string;
  onNavClick?: (label: string) => void;
  /** Top bar */
  pageTitle?: string;
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  onNotificationsClick?: () => void;
  onSettingsClick?: () => void;
  headerAction?: React.ReactNode;
}

export const LayoutWithSidebar: React.FC<LayoutWithSidebarProps> = ({
  children,
  activeItem,
  onNavClick,
  pageTitle,
  userName,
  userRole,
  userAvatar,
  onNotificationsClick,
  onSettingsClick,
  headerAction,
}) => {
  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar activeItem={activeItem} onNavClick={onNavClick} />
      <Layout
        title={pageTitle}
        userName={userName}
        userRole={userRole}
        userAvatar={userAvatar}
        onNotificationsClick={onNotificationsClick}
        onSettingsClick={onSettingsClick}
        headerAction={headerAction}
      >
        {children}
      </Layout>
    </div>
  );
};

export default LayoutWithSidebar;
