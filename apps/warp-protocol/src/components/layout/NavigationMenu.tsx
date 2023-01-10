import classNames from 'classnames';
import { ReactNode } from 'react';
import { ReactComponent as JobsIcon } from 'components/assets/Jobs.svg';
import { ReactComponent as NewIcon } from 'components/assets/New.svg';
import { ReactComponent as DashboardIcon } from 'components/assets/Dashboard.svg';
import { ReactComponent as LightningStrokeIcon } from 'components/assets/LightningStroke.svg';
import { ReactComponent as DotsCircleIcon } from 'components/assets/DotsCircle.svg';
import { ReactComponent as TerminalIcon } from 'components/assets/Terminal.svg';
import { NavLink } from 'react-router-dom';
import styles from './NavigationMenu.module.sass';
import { useNewActionDialog } from './dialogs/NewActionDialog';

interface RouteProps {
  to: string;
  label: string;
  icon: ReactNode;
}

const routes: RouteProps[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/jobs', label: 'Jobs', icon: <JobsIcon /> },
  { to: '/balances', label: 'Balances', icon: <DotsCircleIcon /> },
  { to: '/variables', label: 'Variables', icon: <LightningStrokeIcon /> },
  { to: '/templates', label: 'Templates', icon: <TerminalIcon /> },
];

const Route = (props: RouteProps) => {
  const { icon, to } = props;

  return (
    <NavLink className={styles.route} to={to}>
      <span className={styles.icon}>{icon}</span>
    </NavLink>
  );
};

interface NavigationMenuProps {
  className: string;
}

export const NavigationMenu = (props: NavigationMenuProps) => {
  const { className } = props;

  const openNewActionDialog = useNewActionDialog();

  return (
    <div className={classNames(className, styles.root)}>
      {routes.map((route) => (
        <Route {...route} key={route.label} />
      ))}
      <NewIcon className={styles.route} onClick={() => openNewActionDialog({})} />
    </div>
  );
};
