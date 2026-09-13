import discord from '#/libs/discord';
import { getLeaderboardQueryOptions } from '#/server/fetch/src/leaderboard';
import { Button, Modal, Tooltip } from '@heroui/react';
import { ArrowClockwiseIcon, InfoIcon, RankingIcon } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import Guide from './-_guide';
import Leaderboard from './-_leaderboard';

export default function Header() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <header className="fixed top-4 right-8 z-50 flex **:[button]:size-12">
      <Tooltip>
        <Tooltip.Trigger>
          <Button
            variant="ghost"
            size="lg"
            aria-label="Reload"
            onClick={async () => (queryClient.invalidateQueries(), await router.invalidate(), window.location.reload())}
          >
            <ArrowClockwiseIcon className="size-6 opacity-50" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>Reload</Tooltip.Content>
      </Tooltip>
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
            <Modal.Dialog className="elevation-3 max-w-4xl">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading className="text-2xl font-bold">中国人 Poker Leadboard</Modal.Heading>
              </Modal.Header>
              <Modal.Body>{discord.guildId && <Leaderboard guildId={discord.guildId} />}</Modal.Body>
              <Modal.Footer>
                <Button slot="close">Close</Button>
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
            <Modal.Dialog className="elevation-3 max-w-4xl">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading className="text-2xl font-bold">中国人 Poker Guide</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <Guide />
              </Modal.Body>
              <Modal.Footer>
                <Button slot="close">Close</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </header>
  );
}
