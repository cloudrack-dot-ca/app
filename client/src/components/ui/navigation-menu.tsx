
"use client"

import * as React from "react"
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"
import { cva } from "class-variance-authority"
import { ChevronDown, Menu, X } from "lucide-react"

import { cn } from "../../lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "./sheet"

const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative w-full flex items-center justify-between px-4 py-2 bg-background/95 backdrop-blur-sm">
      {/* Logo or Brand - Always visible */}
      <div className="flex items-center">
        {/* Add your logo or brand here if needed */}
      </div>

      {/* Mobile Navigation */}
      <Sheet>
        <SheetTrigger asChild>
          <button className="block md:hidden p-2 hover:bg-accent rounded-md" aria-label="Menu">
            <Menu className="h-6 w-6" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[85vw] sm:w-[350px] p-0">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <div className="font-semibold text-lg">Menu</div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <nav className="flex flex-col space-y-4">
                {React.Children.map(children, (child) => {
                  if (React.isValidElement(child) && child.type === NavigationMenuItem) {
                    const childContent = React.Children.toArray(child.props.children);
                    
                    return (
                      <div className="py-2">
                        {childContent.map((content, idx) => {
                          if (React.isValidElement(content)) {
                            if (content.type === NavigationMenuTrigger) {
                              // For triggers, render them as section headers
                              return (
                                <div key={idx} className="font-medium text-base mb-3">
                                  {content.props.children.split(' ')[0]}
                                </div>
                              );
                            } else if (content.type === NavigationMenuContent) {
                              // For content, render the children directly in the mobile menu
                              return (
                                <div key={idx} className="pl-3 space-y-2 border-l-2 border-muted">
                                  {React.Children.map(content.props.children, (contentChild) => {
                                    if (React.isValidElement(contentChild)) {
                                      return (
                                        <div className="py-1">
                                          {contentChild}
                                        </div>
                                      );
                                    }
                                    return null;
                                  })}
                                </div>
                              );
                            } else if (content.type === NavigationMenuLink) {
                              // For links, render them directly
                              return (
                                <div key={idx} className="font-medium">
                                  {content}
                                </div>
                              );
                            }
                          }
                          return null;
                        })}
                      </div>
                    );
                  }
                  return null;
                })}
              </nav>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Navigation */}
      <NavigationMenuPrimitive.Root
        ref={ref}
        className={cn(
          "relative z-10 hidden md:flex max-w-max flex-1 items-center justify-center",
          className
        )}
        {...props}
      >
        <NavigationMenuList>
          {children}
        </NavigationMenuList>
        <NavigationMenuViewport />
      </NavigationMenuPrimitive.Root>
    </div>
  )
})
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName

const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(
      "group flex flex-1 list-none items-center justify-center space-x-1",
      className
    )}
    {...props}
  />
))
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName

const NavigationMenuItem = NavigationMenuPrimitive.Item

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
)

const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(navigationMenuTriggerStyle(), "group", className)}
    {...props}
  >
    {children}{" "}
    <ChevronDown
      className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
      aria-hidden="true"
    />
  </NavigationMenuPrimitive.Trigger>
))
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName

const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      "left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto",
      className
    )}
    {...props}
  />
))
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName

const NavigationMenuLink = NavigationMenuPrimitive.Link

const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <div className={cn("absolute left-0 top-full flex justify-center")}>
    <NavigationMenuPrimitive.Viewport
      className={cn(
        "origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]",
        className
      )}
      ref={ref}
      {...props}
    />
  </div>
))
NavigationMenuViewport.displayName = NavigationMenuPrimitive.Viewport.displayName

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuViewport,
}
