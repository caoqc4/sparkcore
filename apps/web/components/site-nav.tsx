"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type SiteNavProps = {
  labels: {
    primaryLabel: string;
    companionGroup: string;
    compareGroup: string;
    companionLinks: {
      aiCompanion: string;
      aiGirlfriend: string;
      aiRoleplay: string;
      aiAssistant: string;
    };
    compareLinks: {
      characterAiAlt: string;
      replikaAlt: string;
    };
    imChat: string;
  };
};

export function SiteNav({ labels }: SiteNavProps) {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!navRef.current) return;
      const openGroups = navRef.current.querySelectorAll<HTMLDetailsElement>(
        "details.site-nav-group[open]"
      );
      openGroups.forEach((details) => {
        if (!details.contains(e.target as Node)) {
          details.removeAttribute("open");
        }
      });
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="site-nav" aria-label={labels.primaryLabel} ref={navRef}>
      <details className="site-nav-group">
        <summary>{labels.companionGroup}</summary>
        <div className="site-nav-menu">
          <Link href="/ai-companion">{labels.companionLinks.aiCompanion}</Link>
          <Link href="/ai-girlfriend">{labels.companionLinks.aiGirlfriend}</Link>
          <Link href="/ai-roleplay-chat">{labels.companionLinks.aiRoleplay}</Link>
          <Link href="/ai-assistant">{labels.companionLinks.aiAssistant}</Link>
        </div>
      </details>
      <details className="site-nav-group">
        <summary>{labels.compareGroup}</summary>
        <div className="site-nav-menu">
          <Link href="/alternatives/character-ai">{labels.compareLinks.characterAiAlt}</Link>
          <Link href="/alternatives/replika">{labels.compareLinks.replikaAlt}</Link>
        </div>
      </details>
      <a href="/#home-im-chat">{labels.imChat}</a>
    </nav>
  );
}
