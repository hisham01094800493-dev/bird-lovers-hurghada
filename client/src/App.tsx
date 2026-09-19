import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Marketplace from "./pages/Marketplace";
import ListingDetails from "./pages/ListingDetails";
import CreateListing from "./pages/CreateListing";
import Community from "./pages/Community";
import Favorites from "./pages/Favorites";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/marketplace" component={Marketplace} />
    <Route path="/listing/:id" component={ListingDetails} />
    <Route path="/sell" component={CreateListing} />
    <Route path="/community" component={Community} />
    <Route path="/favorites" component={Favorites} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
