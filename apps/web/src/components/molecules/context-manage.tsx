"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryParams } from "@/hooks/use-query-params";
import React from "react";

export interface ContentTabConfig {
  value: string;
  label: string;
  Component: React.ReactNode;
}

interface Props {
  defaultValue: string;
  tabsConfig: ContentTabConfig[];
  content?: string;
  onContentChange?: (content: string) => void;
}

export function ContextManager({
  defaultValue,
  tabsConfig,
  content,
  onContentChange,
}: Props) {
  const { get, resetToContent } = useQueryParams();

  let activeContent = get("content") ?? defaultValue;
  if (content) {
    activeContent = content;
  }

  const handleChange = (value: string) => {
    if (onContentChange) return onContentChange(value);
    resetToContent(value)
  };

  return (
    <Tabs
      value={activeContent}
      onValueChange={handleChange}
      className="w-full space-y-6"
    >
      <TabsList className="bg-slate-900/50 border border-slate-800 p-1">
        {tabsConfig.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="data-[state=active]:cursor-default cursor-pointer data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 hover:text-slate-200 transition-all"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabsConfig.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className="mt-0 focus-visible:outline-none"
        >
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {tab.Component}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
