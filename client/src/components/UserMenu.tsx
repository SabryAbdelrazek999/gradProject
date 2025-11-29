import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronDown, User, Key } from "lucide-react";

interface UserMenuProps {
  username: string;
  onProfileClick?: () => void;
  onApiKeysClick?: () => void;
}

export default function UserMenu({ username, onProfileClick, onApiKeysClick }: UserMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="secondary" 
          className="flex items-center gap-2"
          data-testid="button-user-menu"
        >
          <Avatar className="w-6 h-6">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{username}</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem 
          onClick={onProfileClick}
          className="flex items-center gap-2 cursor-pointer"
          data-testid="menu-item-profile"
        >
          <User className="w-4 h-4" />
          <span>My Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={onApiKeysClick}
          className="flex items-center gap-2 cursor-pointer"
          data-testid="menu-item-api-keys"
        >
          <Key className="w-4 h-4" />
          <span>API Keys</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
