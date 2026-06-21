const SRC: Record<string, string> = {
  gold:   '/assets/icon_gold.png',
  wood:   '/assets/icon_wood.png',
  stone:  '/assets/icon_stone.png',
  food:   '/assets/icon_food.png',
  gem:    '/assets/icon_gem.png',
  gems:   '/assets/icon_gem.png',
  dollar: '/assets/icon_dollar.png',
};

export function ResIcon({ type, size = 14 }: { type: string; size?: number }) {
  const src = SRC[type];
  if (!src) return null;
  return (
    <img
      src={src}
      alt={type}
      style={{ width: size, height: size, objectFit: 'contain', verticalAlign: 'middle', display: 'inline-block' }}
    />
  );
}
