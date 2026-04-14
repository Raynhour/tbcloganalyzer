export const classConfig: Record<string, { color: string; icon: string }> = {
  Warrior: { color: '#C79C6E', icon: '/icons/warrior.jpg' },
  Paladin: { color: '#F58CBA', icon: '/icons/paladin.jpg' },
  Hunter: { color: '#ABD473', icon: '/icons/hunter.jpg' },
  Rogue: { color: '#FFF569', icon: '/icons/rogue.jpg' },
  Priest: { color: '#FFFFFF', icon: '/icons/priest.jpg' },
  DeathKnight: { color: '#C41F3B', icon: '/icons/deathknight.jpg' },
  Shaman: { color: '#0070DE', icon: '/icons/shaman.jpg' },
  Mage: { color: '#69CCF0', icon: '/icons/mage.jpg' },
  Warlock: { color: '#9482C9', icon: '/icons/warlock.jpg' },
  Druid: { color: '#FF7D0A', icon: '/icons/druid.jpg' },
};

export function classColor(className: string): string {
  return classConfig[className]?.color ?? '#9CA3AF';
}

export function classIcon(className: string): string {
  return classConfig[className]?.icon ?? '';
}
