
      // Auto-generated index file for Medusa Admin UI extensions
    import WidgetComponent0, { config as WidgetConfig0 } from "C:/Users/Karlo/Desktop/medusa-analytics-plugin/src/admin/widgets/Customers.tsx"
import WidgetComponent1, { config as WidgetConfig1 } from "C:/Users/Karlo/Desktop/medusa-analytics-plugin/src/admin/widgets/Orders.tsx"
import WidgetComponent2, { config as WidgetConfig2 } from "C:/Users/Karlo/Desktop/medusa-analytics-plugin/src/admin/widgets/Products.tsx"

const widgetModule = { widgets: [
  {
    Component: WidgetComponent0,
    zone: ["customer.list.before"]
},
{
    Component: WidgetComponent1,
    zone: ["order.list.before"]
},
{
    Component: WidgetComponent2,
    zone: ["product.list.before"]
}
] }
    import RouteComponent0 from "C:/Users/Karlo/Desktop/medusa-analytics-plugin/src/admin/routes/analytics/page.tsx"

const routeModule = { routes: [
    {
    Component: RouteComponent0,
    path: "/analytics"
  }
]
 }
    import { config as RouteConfig0 } from "C:/Users/Karlo/Desktop/medusa-analytics-plugin/src/admin/routes/analytics/page.tsx"

const menuItemModule = { menuItems: [
    {
    label: RouteConfig0.label,
    icon: RouteConfig0.icon,
    path: "/analytics",
    nested: undefined
  }
]
 }
    

const formModule = { customFields: {
  
} }
    

const displayModule = { 
    displays: {
      
    }
   }
    
    const plugin = {
      widgetModule,
      routeModule,
      menuItemModule,
      formModule,
      displayModule
    }

    export default plugin
    