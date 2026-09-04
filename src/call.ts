// Sole importer of livekit-client — built to dist/call.js, loaded by callLoader.ts.
import {
  Room,
  RoomEvent,
  Track,
  createLocalAudioTrack,
  type LocalAudioTrack,
  type RemoteTrack,
} from 'livekit-client';

import type { WidgetCallRuntime, WidgetCallSession } from './callLoader';

const start: WidgetCallRuntime['start'] = async ({
  voiceUrl,
  token,
  onAnswered,
  onEnded,
}): Promise<WidgetCallSession> => {
  const room = new Room({ adaptiveStream: true, dynacast: true });
  const audioEls: HTMLAudioElement[] = [];
  let ended = false;
  let answered = false;

  // The far end is whoever joins: the voice bot within a second or two, or an
  // inbox agent accepting the ring — either way the call is now live.
  const markAnswered = (): void => {
    if (answered || ended) return;
    answered = true;
    onAnswered();
  };

  // `notify: false` for a failed setup — the caller's catch reports that error,
  // and firing `onEnded` there would report it as an unanswered call instead.
  const teardown = async (notify: boolean): Promise<void> => {
    if (ended) return;
    ended = true;
    for (const el of audioEls) {
      el.srcObject = null;
      el.remove();
    }
    audioEls.length = 0;
    try {
      await room.disconnect();
    } catch {
      /* already gone */
    }
    if (notify) onEnded();
  };

  const end = (): Promise<void> => teardown(true);

  room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
    if (track.kind === Track.Kind.Audio) {
      const el = track.attach() as HTMLAudioElement;
      audioEls.push(el);
      document.body.appendChild(el);
      void el.play().catch(() => {
        /* autoplay is allowed here — the call started from a user gesture */
      });
    }
  });
  room.on(RoomEvent.ParticipantConnected, markAnswered);
  // Remote hangup / network drop ends the call, and so does the last other
  // participant leaving (the bot, or the agent) — but not one of two agents.
  room.on(RoomEvent.Disconnected, () => void end());
  room.on(RoomEvent.ParticipantDisconnected, () => {
    if (room.remoteParticipants.size === 0) void end();
  });

  // Mic permission BEFORE joining: joining is what makes the call real on the
  // server (call row, dashboard ring), so a denied prompt must never ring.
  let mic: LocalAudioTrack | undefined;
  try {
    mic = await createLocalAudioTrack();
    await room.connect(voiceUrl, token);
    await room.localParticipant.publishTrack(mic);
  } catch (err) {
    mic?.stop();
    await teardown(false);
    throw err;
  }
  // The bot may already be in the room by the time we connect.
  if (room.remoteParticipants.size > 0) markAnswered();

  return {
    mute: async (muted: boolean) => {
      await room.localParticipant.setMicrophoneEnabled(!muted);
    },
    end,
  };
};

(
  window as Window & { __heltarWidgetCall?: WidgetCallRuntime }
).__heltarWidgetCall = { start };
