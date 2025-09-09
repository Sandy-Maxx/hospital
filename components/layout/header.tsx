"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  UserCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { data: session } = useSession();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const loadNotifs = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(
          (data.notifications || []).filter((n: any) => !n.isRead).length,
        );
      }
    } catch {}
  };

  useEffect(() => {
    loadNotifs();
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (showNotifs && notifRef.current && !notifRef.current.contains(t))
        setShowNotifs(false);
      if (showUserMenu && userRef.current && !userRef.current.contains(t))
        setShowUserMenu(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showNotifs, showUserMenu]);

  const markRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      if (res.ok) loadNotifs();
    } catch {}
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // SmartSearch handles focus via its own listener; nothing to do here
      }
      if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault();
        window.location.href = "/patients/new";
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          {title && (
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Search with suggestions */}
          <div className="relative">
            {(() => {
              const SmartSearch =
                require("@/components/search/smart-search").default;
              return (
                <SmartSearch placeholder="Search patients, doctors... (Ctrl/Cmd+K)" />
              );
            })()}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => {
                setShowNotifs((s) => !s);
                if (!showNotifs) loadNotifs();
              }}
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="px-3 py-2 border-b font-medium">
                  Notifications
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n: any) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b hover:bg-gray-50 ${!n.isRead ? "bg-blue-50" : ""}`}
                        onClick={() => markRead(n.id)}
                        role="button"
                        title="Mark as read"
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {n.title}
                        </div>
                        {n.body && (
                          <div className="text-xs text-gray-600 mt-1">
                            {n.body}
                          </div>
                        )}
                        <div className="text-[10px] text-gray-400 mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUserMenu((s) => !s)}
              className="flex items-center space-x-3"
              aria-label="User menu"
            >
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {session?.user?.role?.toLowerCase()}
                </p>
              </div>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="py-1">
                  <Link
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    href="/profile"
                  >
                    <UserCircle2 className="w-4 h-4 mr-2" /> My Profile
                  </Link>
                  {session?.user?.role === "ADMIN" && (
                    <Link
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      href="/admin/settings"
                    >
                      <Settings className="w-4 h-4 mr-2" /> Hospital Settings
                    </Link>
                  )}
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    onClick={() => signOut()}
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
