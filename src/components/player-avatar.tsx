import { Avatar } from '@heroui/react/avatar';
import { useMemo } from 'react';

export type PlayerAvatarProps = React.ComponentProps<typeof Avatar> & {
  imageProps?: React.ComponentProps<typeof Avatar.Image>;
  fallbackProps?: React.ComponentProps<typeof Avatar.Fallback>;
  id: string;
  avatarHash: string | undefined | null;
  username: string;
};

export default function PlayerAvatar({ id, avatarHash, username, imageProps, fallbackProps, ...props }: PlayerAvatarProps) {
  const url = useMemo(() => {
    if (!avatarHash) return null;
    if (avatarHash.startsWith('http')) return avatarHash;
    return `${import.meta.env.VITE_DISCORD_CDN_URL}/avatars/${id}/${avatarHash}.${avatarHash.startsWith('a_') ? 'gif' : 'png'}?size=64`;
  }, [id, avatarHash]);

  return (
    <Avatar {...props}>
      <Avatar.Image
        src={url ?? ''}
        alt={username}
        referrerPolicy="no-referrer"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        {...imageProps}
      />
      <Avatar.Fallback {...fallbackProps}>{username.charAt(0).toUpperCase()}</Avatar.Fallback>
    </Avatar>
  );
}
