"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Plus,
  CreditCard,
  Library,
  User,
  ChevronLeft,
  ChevronRight,
  Brain,
  Route,
  HelpCircle,
  Settings,
  Search,
  ChevronDown,
  GraduationCap,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "~/components/ui/sidebar";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";

import { VoiceAgent } from "~/components/voice-agent";

const navigationSections = [
  {
    title: "Aprendizado",
    items: [
      {
        title: "Catálogo de Cursos",
        url: "/catalogo",
        icon: Search,
      },
      {
        title: "Criar Novo Curso",
        url: "/criar-curso",
        icon: Plus,
      },
    ],
  },
  {
    title: "Curso Atual",
    items: [
      {
        title: "Prompt Engineering",
        url: "/curso-overview",
        icon: GraduationCap,
      },
      {
        title: "Aulas",
        url: "/curso-atual",
        icon: BookOpen,
        subItems: [
          {
            title: "Flashcards",
            url: "/flashcards",
            icon: CreditCard,
          },
          {
            title: "Mapa Mental",
            url: "/mapa-mental",
            icon: Brain,
          },
          {
            title: "Roadmap",
            url: "/roadmap",
            icon: Route,
          },
          {
            title: "Quizzes",
            url: "/quizzes",
            icon: HelpCircle,
          },
          {
            title: "Biblioteca",
            url: "/biblioteca",
            icon: Library,
          },
        ],
      },
    ],
  },
  {
    title: "Configurações",
    items: [
      {
        title: "Configurar Perfil",
        url: "/onboarding",
        icon: Settings,
      },
      {
        title: "Perfil",
        url: "/perfil",
        icon: User,
      },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "Curso Atual": true,
  });
  const [showVoiceAgent, setShowVoiceAgent] = useState(false);

  const isActive = (path: string) => pathname === path;
  const toggleSidebar = () => setCollapsed(!collapsed);

  const toggleSection = (sectionTitle: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  const hasActiveSubItem = (items: any[]) => {
    return items.some(
      (item) =>
        isActive(item.url) ||
        (item.subItems &&
          item.subItems.some((subItem: any) => isActive(subItem.url)))
    );
  };

  return (
    <Sidebar
      className={cn(
        "transition-all duration-300 bg-sidebar border-r border-sidebar-border",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <img
              src="/lovable-uploads/b026cd61-7387-4b09-83b5-521537204602.png"
              alt="EduONE Logo"
              className="w-8 h-8"
            />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold text-sidebar-foreground">
                eduONE
              </h1>
              <p className="text-xs text-sidebar-foreground/60">
                A plataforma de aprendizado que se molda para você
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {navigationSections.map((section) => (
          <SidebarGroup key={section.title}>
            {!collapsed && (
              <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs uppercase tracking-wider mb-2">
                {section.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {item.subItems ? (
                      <Collapsible
                        open={openSections[section.title]}
                        onOpenChange={() => toggleSection(section.title)}
                      >
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full",
                              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              hasActiveSubItem([item]) || isActive(item.url)
                                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                                : "text-sidebar-foreground"
                            )}
                          >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && (
                              <>
                                <span className="font-medium flex-1 text-left">
                                  {item.title}
                                </span>
                                <ChevronDown
                                  className={cn(
                                    "w-4 h-4 transition-transform duration-200",
                                    openSections[section.title]
                                      ? "rotate-180"
                                      : ""
                                  )}
                                />
                              </>
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        {!collapsed && (
                          <CollapsibleContent>
                            <SidebarMenuSub className="ml-6 mt-1 space-y-1">
                              {item.subItems.map((subItem: any) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton asChild>
                                    <Link
                                      href={subItem.url}
                                      className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                        isActive(subItem.url)
                                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                                          : "text-sidebar-foreground/80"
                                      )}
                                    >
                                      <subItem.icon className="w-4 h-4 flex-shrink-0" />
                                      <span className="text-sm">
                                        {subItem.title}
                                      </span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>

                            {/* Botão Falar com Professor - dentro do contexto das aulas */}
                            <div className="ml-6 mt-2">
                              <Button
                                variant="ghost"
                                onClick={() => setShowVoiceAgent(true)}
                                className={cn(
                                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80"
                                )}
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  className="w-4 h-4 flex-shrink-0"
                                  fill="none"
                                >
                                  <defs>
                                    <linearGradient
                                      id="owlGradient"
                                      x1="0%"
                                      y1="0%"
                                      x2="100%"
                                      y2="100%"
                                    >
                                      <stop offset="0%" stopColor="#3B82F6" />
                                      <stop offset="100%" stopColor="#8B5CF6" />
                                    </linearGradient>
                                  </defs>
                                  {/* Corpo da coruja como livro */}
                                  <path
                                    d="M6 4h12c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                                    fill="url(#owlGradient)"
                                  />
                                  {/* Face da coruja */}
                                  <path
                                    d="M12 8c-2.2 0-4 1.8-4 4 0 .5.1 1 .3 1.4.4-.2.8-.4 1.2-.4.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5c-.4 0-.8-.2-1.2-.4-.2.4-.3.9-.3 1.4 0 2.2 1.8 4 4 4s4-1.8 4-4c0-.5-.1-1-.3-1.4-.4.2-.8.4-1.2.4-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5c.4 0 .8.2 1.2.4.2-.4.3-.9.3-1.4 0-2.2-1.8-4-4-4z"
                                    fill="white"
                                  />
                                  {/* Olhos */}
                                  <circle
                                    cx="10"
                                    cy="10"
                                    r="1.5"
                                    fill="#1E293B"
                                  />
                                  <circle
                                    cx="14"
                                    cy="10"
                                    r="1.5"
                                    fill="#1E293B"
                                  />
                                  {/* Bico */}
                                  <path
                                    d="M12 11.5l-1 1.5h2l-1-1.5z"
                                    fill="#1E293B"
                                  />
                                </svg>
                                <span className="text-sm">
                                  Falar com Professor
                                </span>
                              </Button>
                            </div>
                          </CollapsibleContent>
                        )}
                      </Collapsible>
                    ) : (
                      <SidebarMenuButton asChild>
                        <Link
                          href={item.url}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            isActive(item.url)
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                              : "text-sidebar-foreground"
                          )}
                        >
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          {!collapsed && (
                            <span className="font-medium">{item.title}</span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-2">
        {/* Botão Collapse */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="w-full h-10 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </SidebarFooter>

      {/* Voice Agent Modal */}
      <VoiceAgent
        isOpen={showVoiceAgent}
        onClose={() => setShowVoiceAgent(false)}
        currentProgress={30}
        userPreferences={{
          preferredTopics: ["prompt-engineering", "fundamentos"],
          learningStyle: "interactive",
          currentLevel: "beginner",
          professorMode: true,
        }}
      />
    </Sidebar>
  );
}
