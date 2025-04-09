import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import { ThemeProvider, createMuiTheme, CssBaseline } from '@material-ui/core';
import { blue, grey } from '@material-ui/core/colors';

// Auth Provider
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DocumentUpload from './pages/DocumentUpload';
import DocumentView from './pages/DocumentView';
import Login from './components/Login';
import Users from './pages/Users';
import UserProfile from './pages/UserProfile';
import NotFound from './pages/NotFound';
import Settings from './pages/Settings';
import ActivityLog from './pages/ActivityLog';
import Reports from './pages/Reports';

// Define theme
const theme = createMuiTheme({
  palette: {
    primary: {
      main: blue[700],
    },
    secondary: {
      main: grey[800],
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  overrides: {
    MuiButton: {
      root: {
        textTransform: 'none',
      },
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ component: Component, ...rest }) => {
  const { isAuthenticated, loading } = useAuth();
  
  return (
    <Route
      {...rest}
      render={(props) =>
        loading ? (
          // Show loading indicator while checking authentication
          <div>Loading...</div>
        ) : isAuthenticated ? (
          // Render requested component if authenticated
          <MainLayout>
            <Component {...props} />
          </MainLayout>
        ) : (
          // Redirect to login if not authenticated
          <Redirect
            to={{
              pathname: '/login',
              state: { from: props.location },
            }}
          />
        )
      }
    />
  );
};

// Public Route Component
const PublicRoute = ({ component: Component, restricted, ...rest }) => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated && restricted ? (
          // Redirect to dashboard if trying to access public restricted route (like login) when authenticated
          <Redirect to="/dashboard" />
        ) : (
          <AuthLayout>
            <Component {...props} />
          </AuthLayout>
        )
      }
    />
  );
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Switch>
            {/* Public routes */}
            <PublicRoute restricted path="/login" component={Login} exact />
            
            {/* Redirect root to dashboard */}
            <Route exact path="/">
              <Redirect to="/dashboard" />
            </Route>
            
            {/* Protected routes */}
            <ProtectedRoute path="/dashboard" component={Dashboard} exact />
            <ProtectedRoute path="/documents" component={Documents} exact />
            <ProtectedRoute path="/documents/upload" component={DocumentUpload} exact />
            <ProtectedRoute path="/documents/:id" component={DocumentView} exact />
            <ProtectedRoute path="/users" component={Users} exact />
            <ProtectedRoute path="/users/profile" component={UserProfile} exact />
            <ProtectedRoute path="/settings" component={Settings} exact />
            <ProtectedRoute path="/activity" component={ActivityLog} exact />
            <ProtectedRoute path="/reports" component={Reports} exact />
            
            {/* 404 Not Found */}
            <Route component={NotFound} />
          </Switch>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;