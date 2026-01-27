'use client';

import { useState } from 'react';
import React from 'react';

export function Tabs({ defaultValue, children, className }) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  const childrenArray = Array.isArray(children) ? children : [children];
  const tabsList = childrenArray.find(child => child.type === TabsList);
  const tabsContent = childrenArray.filter(child => child.type === TabsContent);
  
  return (
    <div className={className}>
      {tabsList && React.cloneElement(tabsList, { activeTab, setActiveTab })}
      {tabsContent.find(content => content.props.value === activeTab)}
    </div>
  );
}

export function TabsList({ children, activeTab, setActiveTab, className }) {
  return (
    <div className={className}>
      {React.Children.map(children, child =>
        React.cloneElement(child, {
          isActive: child.props.value === activeTab,
          onClick: () => setActiveTab(child.props.value)
        })
      )}
    </div>
  );
}

export function TabsTrigger({ children, isActive, onClick, className }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors ${className}`}
      data-state={isActive ? 'active' : 'inactive'}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, value }) {
  return <div>{children}</div>;
}