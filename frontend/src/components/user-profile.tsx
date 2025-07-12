"use client";

import { toast } from "sonner";
import { User, Settings, Sun, Moon, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

export function UserProfile() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleProfileClick = () => {
    router.push("/perfil");
  };

  const handleSettingsClick = () => {
    toast("Configurações", {
      description: "Funcionalidade em desenvolvimento",
    });
  };

  const handleLogout = () => {
    toast("Desconectado", {
      description: "Você foi desconectado com sucesso",
    });
    // Redirect to login or home page
    router.push("/");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="flex items-center gap-4">
      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="text-foreground/60 hover:text-foreground"
        onClick={toggleTheme}
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt="Usuário" />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                JB
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium">
                jonathan.batista.ferreira.m@gmail.com
              </p>
              <p className="text-xs text-muted-foreground">Plano Gratuito</p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 bg-popover border-border"
        >
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={handleProfileClick}
          >
            <User className="mr-2 h-4 w-4" />
            Meu Perfil
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={handleSettingsClick}
          >
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
