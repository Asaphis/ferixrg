/* FerixRG — Quiet Instrument Panel: route users from the editorial product narrative into an evidence-led workspace. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Workspace from "./pages/Workspace";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { AboutPage, ContactPage, FeaturesPage, HowItWorksPage, PlatformsPage, PricingPage, ResourcesPage, SolutionsPage } from "./pages/PublicPages";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/features" component={FeaturesPage} />
      <Route path="/how-it-works" component={HowItWorksPage} />
      <Route path="/solutions" component={SolutionsPage} />
      <Route path="/platforms" component={PlatformsPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/resources" component={ResourcesPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/auth/:page" component={Auth} />
      <Route path="/auth" component={Auth} />
      <Route path="/app" component={Workspace} />
      <Route path="/app/:rest*" component={Workspace} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
