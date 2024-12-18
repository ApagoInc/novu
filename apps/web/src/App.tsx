import * as Sentry from '@sentry/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Route, Routes, BrowserRouter, Navigate } from 'react-router-dom';
import { withLDProvider } from 'launchdarkly-react-client-sdk';
import LogRocket from 'logrocket';
import setupLogRocketReact from 'logrocket-react';
import { Integrations } from '@sentry/tracing';
import { library } from '@fortawesome/fontawesome-svg-core';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';

import packageJson from '../package.json';
import { AuthProvider } from './components/providers/AuthProvider';
import { applyToken, getToken } from './hooks';
import { ActivitiesPage } from './pages/activities/ActivitiesPage';
import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
import HomePage from './pages/HomePage';
import TemplateEditorPage from './pages/templates/editor/TemplateEditorPage';
import WorkflowListPage from './pages/templates/WorkflowListPage';
import SubscribersList from './pages/subscribers/SubscribersListPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import InvitationPage from './pages/auth/InvitationPage';
import { api } from './api/api.client';
import { PasswordResetPage } from './pages/auth/PasswordResetPage';
import { AppLayout } from './components/layout/AppLayout';
import { MembersInvitePage } from './pages/invites/MembersInvitePage';
import CreateOrganizationPage from './pages/auth/CreateOrganizationPage';
import { ENV, LAUNCH_DARKLY_CLIENT_SIDE_ID, SENTRY_DSN, CONTEXT_PATH, LOGROCKET_ID } from './config';
import { PromoteChangesPage } from './pages/changes/PromoteChangesPage';
import { LinkVercelProjectPage } from './pages/partner-integrations/LinkVercelProjectPage';
import { ROUTES } from './constants/routes.enum';
import { BrandPage } from './pages/brand/BrandPage';
import { SegmentProvider } from './components/providers/SegmentProvider';
import { NotificationCenter } from './pages/quick-start/steps/NotificationCenter';
import { FrameworkSetup } from './pages/quick-start/steps/FrameworkSetup';
import { Setup } from './pages/quick-start/steps/Setup';
import { RequiredAuth } from './components/layout/RequiredAuth';
import { GetStarted } from './pages/quick-start/steps/GetStarted';
import { DigestPreview } from './pages/quick-start/steps/DigestPreview';
import { TemplatesDigestPlaygroundPage } from './pages/templates/TemplatesDigestPlaygroundPage';
import { Sidebar } from './pages/templates/workflow/SideBar/Sidebar';
import { TemplateSettings } from './pages/templates/components/TemplateSettings';
import { UserPreference } from './pages/templates/components/UserPreference';
import { TestWorkflowPage } from './pages/templates/components/TestWorkflowPage';
import { SnippetPage } from './pages/templates/components/SnippetPage';
import { ChannelStepEditor } from './pages/templates/components/ChannelStepEditor';
import { ProvidersPage } from './pages/templates/components/ProvidersPage';
import { InAppSuccess } from './pages/quick-start/steps/InAppSuccess';
import { IntegrationsListPage } from './pages/integrations/IntegrationsListPage';
import { CreateProviderPage } from './pages/integrations/CreateProviderPage';
import { UpdateProviderPage } from './pages/integrations/UpdateProviderPage';
import { SelectProviderPage } from './pages/integrations/components/SelectProviderPage';
import { TenantsPage } from './pages/tenants/TenantsPage';
import { CreateTenantPage } from './pages/tenants/CreateTenantPage';
import { UpdateTenantPage } from './pages/tenants/UpdateTenantPage';
import { ApiKeysCard } from './pages/settings/tabs';
import { EmailSettings } from './pages/settings/tabs/EmailSettings';
import { ProductLead } from './components/utils/ProductLead';
import { SSO, UserAccess } from './design-system/icons';
import { Cloud } from './design-system/icons/general/Cloud';
import { BrandingForm, LayoutsListPage } from './pages/brand/tabs';

library.add(far, fas);

const defaultQueryFn = async ({ queryKey }: { queryKey: string }) => {
  const response = await api.get(`${queryKey[0]}`);

  return response.data?.data;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn as any,
    },
  },
});

const tokenStoredToken: string = getToken();

applyToken(tokenStoredToken);

// console.log('web CONTEXT_PATH:', CONTEXT_PATH)
// console.log(process.env)

const webAppCtxPath = '/web';

// console.log('context path being used:', CONTEXT_PATH || webAppCtxPath)

function App() {
  return (
    <SegmentProvider>
      <HelmetProvider>
        <BrowserRouter basename={CONTEXT_PATH || webAppCtxPath}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <Routes>
                {/* TODO - disable the below - make where signups must be approved. 
                 
                 Currently, users can only be added by "inviting" them on the invitation page.
                 - The user's email must be entered, and an invite link is then generated.
                 (Novu says the invite link is sent via email, but it is not currently sent to the user - this must be configured, if it's desired as a feature moving forward.)
                 - Click the user's "pending" invite on the 3 dots icon, and select copy invite link.
                 - Give the invite link privately to the user via an email or similar format. 
                 
                 ---

                 If it's ever desired to change this, consider:
                 - making it where signups require an LSP admin email and password? 
                 */}
                {/* We can't allow this to be exposed to the open internet, regardless of what its URL is. */}
                {/* If this is exposed - anyone who can access the novu server's endpoints can "sign up". That is trouble. */}
                {/* <Route path={`${ROUTES.AUTH_SIGNUP}_5d7d6c10-b4d2-43c9-87a6-085e517e5efa`} element={<SignUpPage />} /> */}
                <Route path={ROUTES.AUTH_LOGIN} element={<LoginPage />} />
                <Route path={ROUTES.AUTH_RESET_REQUEST} element={<PasswordResetPage />} />
                <Route path={ROUTES.AUTH_RESET_TOKEN} element={<PasswordResetPage />} />
                <Route path={ROUTES.AUTH_INVITATION_TOKEN} element={<InvitationPage />} />
                {/* Same principle here. We must not expose this endpoint freely, as it allows anyone to perform this action. */}
                {/* Only signed-in users can create organizations. */}
                <Route path={ROUTES.AUTH_APPLICATION} element={<CreateOrganizationPage />} />
                {/* <Route
                  path={ROUTES.PARTNER_INTEGRATIONS_VERCEL_LINK_PROJECTS}
                  element={
                    <RequiredAuth>
                      <LinkVercelProjectPage type="create" />
                    </RequiredAuth>
                  }
                />
                <Route
                  path={ROUTES.PARTNER_INTEGRATIONS_VERCEL_LINK_PROJECTS_EDIT}
                  element={
                    <RequiredAuth>
                      <LinkVercelProjectPage type="edit" />
                    </RequiredAuth>
                  }
                /> */}
                <Route element={<AppLayout />}>
                  <Route path={ROUTES.ANY} element={<HomePage />} />
                  <Route path={ROUTES.WORKFLOWS_DIGEST_PLAYGROUND} element={<TemplatesDigestPlaygroundPage />} />
                  <Route path={ROUTES.WORKFLOWS_CREATE} element={<TemplateEditorPage />} />
                  <Route path={ROUTES.WORKFLOWS_EDIT_TEMPLATEID} element={<TemplateEditorPage />}>
                    <Route path="" element={<Sidebar />} />
                    <Route path="settings" element={<TemplateSettings />} />
                    <Route path="channels" element={<UserPreference />} />
                    <Route path="test-workflow" element={<TestWorkflowPage />} />
                    <Route path="snippet" element={<SnippetPage />} />
                    <Route path="providers" element={<ProvidersPage />} />
                    <Route path=":channel/:stepUuid" element={<ChannelStepEditor />} />
                  </Route>
                  <Route path={ROUTES.WORKFLOWS} element={<WorkflowListPage />} />
                  <Route path={ROUTES.TENANTS} element={<TenantsPage />}>
                    <Route path="create" element={<CreateTenantPage />} />
                    <Route path=":identifier" element={<UpdateTenantPage />} />
                  </Route>
                  {/* <Route path={ROUTES.GET_STARTED} element={<GetStarted />} />
                    <Route path={ROUTES.GET_STARTED_PREVIEW} element={<DigestPreview />} />
                    <Route path={ROUTES.QUICK_START_NOTIFICATION_CENTER} element={<NotificationCenter />} />
                    <Route path={ROUTES.QUICK_START_SETUP} element={<FrameworkSetup />} />
                    <Route path={ROUTES.QUICK_START_SETUP_FRAMEWORK} element={<Setup />} />
                    <Route path={ROUTES.QUICK_START_SETUP_SUCCESS} element={<InAppSuccess />} /> */}
                  <Route path={ROUTES.ACTIVITIES} element={<ActivitiesPage />} />
                  <Route path={ROUTES.SETTINGS} element={<SettingsPage />}>
                    <Route path="" element={<ApiKeysCard />} />
                    <Route path="email" element={<EmailSettings />} />
                    <Route
                      path="permissions"
                      element={
                        <ProductLead
                          icon={<UserAccess />}
                          id="rbac-permissions"
                          title="Role-based access control"
                          text="Securely manage users' permissions to access system resources."
                          closeable={false}
                        />
                      }
                    />
                    <Route
                      path="sso"
                      element={
                        <ProductLead
                          icon={<SSO />}
                          id="sso-settings"
                          title="Single Sign-On (SSO)"
                          text="Simplify user authentication and enhance security."
                          closeable={false}
                        />
                      }
                    />
                    <Route
                      path="data-integrations"
                      element={
                        <ProductLead
                          icon={<Cloud />}
                          id="data-integrations-settings"
                          title="Data Integrations"
                          text="Share data with 3rd party services via Segment and Datadog integrations to monitor analytics."
                          closeable={false}
                        />
                      }
                    />
                  </Route>
                  <Route path={ROUTES.INTEGRATIONS} element={<IntegrationsListPage />}>
                    <Route path="create" element={<SelectProviderPage />} />
                    <Route path="create/:channel/:providerId" element={<CreateProviderPage />} />
                    <Route path=":integrationId" element={<UpdateProviderPage />} />
                  </Route>
                  <Route path={ROUTES.TEAM} element={<MembersInvitePage />} />
                  <Route path={ROUTES.CHANGES} element={<PromoteChangesPage />} />
                  <Route path={ROUTES.SUBSCRIBERS} element={<SubscribersList />} />
                  <Route path={ROUTES.BRAND} element={<BrandPage />}>
                    <Route path="" element={<BrandingForm />} />
                    <Route path="layouts" element={<LayoutsListPage />} />
                  </Route>
                </Route>
                <Route path="*" element={<Navigate to={ROUTES.AUTH_LOGIN} />} />
              </Routes>
            </AuthProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </HelmetProvider>
    </SegmentProvider>
  );
}

export default Sentry.withProfiler(
  withLDProvider({
    clientSideID: LAUNCH_DARKLY_CLIENT_SIDE_ID,
    reactOptions: {
      useCamelCaseFlagKeys: false,
    },
  })(App)
);
