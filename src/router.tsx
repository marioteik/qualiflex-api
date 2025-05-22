import {
  createBrowserRouter,
  Link,
  Navigate,
  Outlet,
  redirect,
  RouterProvider,
} from "react-router-dom";
import "./index.css";
import { BreadcrumbLink } from "./components/ui/breadcrumb";
import { queryClient } from "@/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { destroySession, useGlobalStore } from "@/stores/global-store";
import Root from "./routes/root";
import SignIn from "@/routes/auth/signin";
import ErrorPage from "./error-page";
import Dashboard from "@/routes/dashboard";
import Roles from "@/routes/permissions/roles";
import Providers from "./providers";
import PermissionsWrapper from "@/routes/permissions";
import Users from "@/routes/users";
import Shipments from "@/routes/shipments";
import Chats from "./routes/chats";
import LoadList from "@/routes/load-list";
import Products from "@/routes/products";
import Orders from "@/routes/orders";
import apiClient from "./api-client";
import ForgotPassword from "./routes/auth/forgot-password";
import ShipmentImportsPage from "@/routes/shipments-imports";

// ... existing code ...

      {
        path: "orders",
        element: <Orders />,
        handle: {
          crumb: () => (
            <BreadcrumbLink asChild>
              <Link to="/orders">Ordens de Pedido</Link>
            </BreadcrumbLink>
          ),
        },
      },
      {
        path: "shipments-imports",
        element: <ShipmentImportsPage />,
        handle: {
          crumb: () => (
            <BreadcrumbLink asChild>
              <Link to="/shipments-imports">Remessas Sincronizadas</Link>
            </BreadcrumbLink>
          ),
        },
      },
    ],
  },
  {
    path: "/auth",
    element: (
// ... existing code ... 