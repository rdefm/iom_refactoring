import React from 'react';

const NAV_TABS = [
  { id:"action",    icon:"⚡", label:"Action"    },
  { id:"character", icon:"👤", label:"Character"  },
  { id:"wells",     icon:"💧", label:"Wells"      },
  { id:"contacts",  icon:"👥", label:"Contacts"   },
  { id:"home",      icon:"🏠", label:"Home"       },
];

export function BottomNav({ activeTab, setTab, badges={} }) {
  return (
    <nav className="bottom-nav" role="tablist">
      {NAV_TABS.map(t => (
        <button key={t.id} className={`nav-tab${activeTab===t.id?" active":""}`} role="tab"
          aria-selected={activeTab===t.id} onClick={()=>setTab(t.id)}>
          {badges[t.id] && <span className="nav-badge" />}
          <span className="nav-icon">{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
