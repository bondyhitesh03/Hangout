import { initials } from '../lib/utils';

type AvatarProps = {
  url?: string | null;
  name: string;
  size?: number;
  ring?: boolean;
  className?: string;
};

export function Avatar({ url, name, size = 40, ring = false, className = '' }: AvatarProps) {
  const dim = { width: size, height: size };
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={dim}
        className={`rounded-full object-cover ${ring ? 'ring-2 ring-brand-400/60 ring-offset-2 ring-offset-ink-900' : ''} ${className}`}
      />
    );
  }
  return (
    <div
      style={{ ...dim, fontSize: size * 0.4 }}
      className={`rounded-full flex items-center justify-center font-semibold text-white ${ring ? 'ring-2 ring-brand-400/60 ring-offset-2 ring-offset-ink-900' : ''} ${className}`}
    >
      <span
        className="rounded-full w-full h-full flex items-center justify-center"
        style={{ backgroundImage: 'linear-gradient(135deg, #5c7bff 0%, #4ade80 100%)' }}
      >
        {initials(name || '?')}
      </span>
    </div>
  );
}
