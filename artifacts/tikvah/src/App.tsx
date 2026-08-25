import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider, RequireAuth, RequireAdmin } from '@/lib/auth';
import NotFound from '@/pages/not-found';
import { Home } from '@/pages/home';
import { About } from '@/pages/about';
import { Privacy } from '@/pages/privacy';
import { Crisis } from '@/pages/crisis';
import { Resources } from '@/pages/resources';
import { Professionals } from '@/pages/professionals';
import { Login } from '@/pages/auth/login';
import { Register } from '@/pages/auth/register';
import { VerifyEmail } from '@/pages/auth/verify-email';
import { ForgotPassword } from '@/pages/auth/forgot-password';
import { ResetPassword } from '@/pages/auth/reset-password';
import { Dashboard } from '@/pages/dashboard';
import { Conversations } from '@/pages/conversations';
import { ConversationThread } from '@/pages/conversation-thread';
import { AdminInbox } from '@/pages/admin/inbox';
import { AdminConversationThread } from '@/pages/admin/conversation-thread';
import { AdminAnalytics } from '@/pages/admin/analytics';
import { AdminResources } from '@/pages/admin/resources';
import { AdminProfessionals } from '@/pages/admin/professionals';

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/crisis" component={Crisis} />
      <Route path="/resources" component={Resources} />
      <Route path="/professionals" component={Professionals} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />

      <Route path="/dashboard">
        {() => (
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        )}
      </Route>
      <Route path="/conversations">
        {() => (
          <RequireAuth>
            <Conversations />
          </RequireAuth>
        )}
      </Route>
      <Route path="/conversations/:id">
        {params => (
          <RequireAuth>
            <ConversationThread params={params} />
          </RequireAuth>
        )}
      </Route>

      <Route path="/admin">
        {() => (
          <RequireAdmin>
            <AdminInbox />
          </RequireAdmin>
        )}
      </Route>
      <Route path="/admin/analytics">
        {() => (
          <RequireAdmin>
            <AdminAnalytics />
          </RequireAdmin>
        )}
      </Route>
      <Route path="/admin/resources">
        {() => (
          <RequireAdmin>
            <AdminResources />
          </RequireAdmin>
        )}
      </Route>
      <Route path="/admin/professionals">
        {() => (
          <RequireAdmin>
            <AdminProfessionals />
          </RequireAdmin>
        )}
      </Route>
      <Route path="/admin/conversations/:id">
        {params => (
          <RequireAdmin>
            <AdminConversationThread params={params} />
          </RequireAdmin>
        )}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
