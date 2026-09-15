import discord from '#/libs/discord';
import { getLeaderboardQueryOptions } from '#/server/fetch/src/leaderboard';
import { Button, Modal, Tooltip, Typography } from '@heroui/react';
import { InfoIcon, RankingIcon } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import Guide from './-_guide';
import Leaderboard from './-_leaderboard';

export default function Header() {
  const queryClient = useQueryClient();

  return (
    <header className="fixed inset-x-8 top-4 z-50 flex items-center **:[button]:size-12">
      <Typography color="muted" weight="bold" className="pointer-events-none mr-auto opacity-50 select-none">
        中国人 POKER
      </Typography>
      <Modal>
        <Tooltip>
          <Tooltip.Trigger>
            <Button
              variant="ghost"
              size="lg"
              aria-label="Leaderboard"
              onMouseEnter={() => discord.guildId && queryClient.query(getLeaderboardQueryOptions({ guildId: discord.guildId }))}
            >
              <RankingIcon className="size-6 opacity-50" />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content>Leaderboard</Tooltip.Content>
        </Tooltip>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="elevation-3 max-w-2xl">
              <Modal.CloseTrigger className="elevation-3" />
              <Modal.Header>
                <Modal.Heading className="text-2xl font-bold">中国人 Poker Leaderboard</Modal.Heading>
              </Modal.Header>
              <Modal.Body>{discord.guildId && <Leaderboard guildId={discord.guildId} />}</Modal.Body>
              <Modal.Footer>
                <Button slot="close" className="elevation-3">
                  Close
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
      <Modal>
        <Tooltip>
          <Tooltip.Trigger>
            <Button variant="ghost" size="lg" aria-label="About">
              <InfoIcon className="size-6 opacity-50" />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content>Guide</Tooltip.Content>
        </Tooltip>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="elevation-3 max-w-2xl">
              <Modal.CloseTrigger className="elevation-3" />
              <Modal.Header>
                <Modal.Heading className="text-2xl font-bold">中国人 Poker Guide</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <Guide />
              </Modal.Body>
              <Modal.Footer>
                <Button slot="close" className="elevation-3">
                  Close
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </header>
  );
}
