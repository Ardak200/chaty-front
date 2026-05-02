import { ref, shallowRef } from "vue";
import { getSocket } from "../api/socket";
import type { Socket } from "socket.io-client";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turns:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

type CallStatus = "idle" | "calling" | "ringing" | "in-call";

interface IncomingCall {
  from: string;
  fromUsername: string;
  offer: RTCSessionDescriptionInit;
}

// Module-level state — this composable is a singleton.
// Only one call can happen at a time, and any component that
// calls useWebRTC() shares the same state.
const status = ref<CallStatus>("idle");
const localStream = shallowRef<MediaStream | null>(null);
const remoteStream = shallowRef<MediaStream | null>(null);
const incomingCall = ref<IncomingCall | null>(null);
const isMuted = ref(false);
const isCameraOff = ref(false);

let pc: RTCPeerConnection | null = null;
let peerId: string | null = null;
let listenersBound = false;
let pendingIceCandidates: RTCIceCandidateInit[] = [];

async function processIceQueue() {
  if (!pc || !pc.remoteDescription) return;
  while (pendingIceCandidates.length > 0) {
    const candidate = pendingIceCandidates.shift();
    if (candidate) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        console.error("Failed to add queued ICE candidate:", err);
      }
    }
  }
}

export function bindCallListeners(socket: Socket) {
  if (listenersBound) return;
  listenersBound = true;

  socket.on(
    "call:offer",
    (data: {
      from: string;
      fromUsername: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      incomingCall.value = data;
      status.value = "ringing";
    },
  );

  socket.on(
    "call:answer",
    async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
      if (!pc) return;
      try {
        await pc.setRemoteDescription(data.answer);
        status.value = "in-call";
        await processIceQueue();
      } catch (err) {
        console.error("setRemoteDescription failed:", err);
      }
    },
  );

  socket.on(
    "call:ice",
    async (data: { from: string; candidate: RTCIceCandidateInit }) => {
      if (!pc || !pc.remoteDescription) {
        pendingIceCandidates.push(data.candidate);
        return;
      }
      try {
        await pc.addIceCandidate(data.candidate);
      } catch (err) {
        console.error("addIceCandidate failed:", err);
      }
    },
  );

  socket.on("call:end", () => {
    cleanupInternal();
  });

  socket.on("disconnect", () => {
    listenersBound = false;
  });
}

function cleanupInternal() {
  localStream.value?.getTracks().forEach((track) => track.stop());
  localStream.value = null;
  remoteStream.value = null;
  pc?.close();
  pc = null;
  peerId = null;
  incomingCall.value = null;
  status.value = "idle";
  isMuted.value = false;
  isCameraOff.value = false;
  pendingIceCandidates = [];
}

export function useWebRTC() {
  function createPeerConnection(remotePeerId: string) {
    peerId = remotePeerId;
    pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate && peerId) {
        getSocket()?.emit("call:ice", {
          to: peerId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      remoteStream.value = event.streams[0];
    };

    pc.onconnectionstatechange = () => {
      console.log("WebRTC connection state:", pc?.connectionState);
      if (
        pc?.connectionState === "disconnected" ||
        pc?.connectionState === "failed" ||
        pc?.connectionState === "closed"
      ) {
        cleanup();
      }
    };

    return pc;
  }

  async function getLocalMedia() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStream.value = stream;
    return stream;
  }

  async function startCall(remoteUserId: string) {
    try {
      status.value = "calling";
      const stream = await getLocalMedia();
      const connection = createPeerConnection(remoteUserId);

      stream.getTracks().forEach((track) => connection.addTrack(track, stream));

      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);

      getSocket()?.emit("call:offer", {
        to: remoteUserId,
        offer,
      });
    } catch (err) {
      console.error("startCall failed:", err);
      cleanup();
    }
  }

  async function acceptCall() {
    if (!incomingCall.value) return;

    try {
      const { from, offer } = incomingCall.value;
      status.value = "in-call";

      const stream = await getLocalMedia();
      const connection = createPeerConnection(from);

      stream.getTracks().forEach((track) => connection.addTrack(track, stream));

      await connection.setRemoteDescription(offer);
      await processIceQueue();
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);

      getSocket()?.emit("call:answer", {
        to: from,
        answer,
      });

      incomingCall.value = null;
    } catch (err) {
      console.error("acceptCall failed:", err);
      cleanup();
    }
  }

  function rejectCall() {
    if (incomingCall.value) {
      getSocket()?.emit("call:end", { to: incomingCall.value.from });
      incomingCall.value = null;
    }
    status.value = "idle";
  }

  function endCall() {
    if (peerId) {
      getSocket()?.emit("call:end", { to: peerId });
    }
    cleanup();
  }

  function toggleMute() {
    if (!localStream.value) return;
    localStream.value.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    isMuted.value = !isMuted.value;
  }

  function toggleCamera() {
    if (!localStream.value) return;
    localStream.value.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    isCameraOff.value = !isCameraOff.value;
  }

  function cleanup() {
    cleanupInternal();
  }

  return {
    status,
    localStream,
    remoteStream,
    incomingCall,
    isMuted,
    isCameraOff,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
  };
}
