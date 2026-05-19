import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { generateRoutes } from '@/config/router/routesGenerator'

const router = createBrowserRouter(generateRoutes())

const RouterShell: React.FC = () => <RouterProvider router={router} />

export default RouterShell
