<script setup lang="ts">
import { watch, useTemplateRef } from "vue";
import { useWebRTC } from "../composables/useWebRTC";

const {
  status,
  localStream,
  remoteStream,
  incomingCall,
  isMuted,
  isCameraOff,
  acceptCall,
  rejectCall,
  endCall,
  toggleMute,
  toggleCamera,
} = useWebRTC();

const localVideo = useTemplateRef<HTMLVideoElement>("localVideo");
const remoteVideo = useTemplateRef<HTMLVideoElement>("remoteVideo");

// srcObject isn't a regular HTML attribute — it can't be bound via :srcObject.
// Instead, watch the stream refs and set srcObject imperatively.
watch(localStream, (stream) => {
  if (localVideo.value) localVideo.value.srcObject = stream;
});

watch(remoteStream, (stream) => {
  if (remoteVideo.value) remoteVideo.value.srcObject = stream;
});
</script>

<template>
  <!-- Incoming call toast -->
  <div v-if="status === 'ringing' && incomingCall" class="ringing">
    <div class="ringing-card">
      <p>
        <strong>{{ incomingCall.fromUsername }}</strong> is calling you
      </p>
      <div class="ringing-actions">
        <button class="accept" @click="acceptCall">Accept</button>
        <button class="reject" @click="rejectCall">Reject</button>
      </div>
    </div>
  </div>

  <!-- Active / outgoing call -->
  <div v-if="status === 'calling' || status === 'in-call'" class="call-overlay">
    <div class="videos">
      <video ref="remoteVideo" class="remote" autoplay playsinline></video>
      <video ref="localVideo" class="local" autoplay playsinline muted></video>
    </div>

    <div class="status-text" v-if="status === 'calling'">Calling...</div>

    <div class="controls">
      <button @click="toggleMute" :class="{ off: isMuted }">
        {{ isMuted ? "Unmute" : "Mute" }}
      </button>
      <button @click="toggleCamera" :class="{ off: isCameraOff }">
        {{ isCameraOff ? "Camera on" : "Camera off" }}
      </button>
      <button class="hangup" @click="endCall">Hang up</button>
    </div>
  </div>
</template>

<style scoped>
.call-overlay {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 200;
  display: flex;
  flex-direction: column;
}

.videos {
  flex: 1;
  min-height: 0;
  position: relative;
}

.remote {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #111;
}

.local {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 180px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: #222;
}

.status-text {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 18px;
  background: rgba(0, 0, 0, 0.5);
  padding: 8px 16px;
  border-radius: 20px;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.8);
  flex-shrink: 0;
}

.controls button {
  padding: 12px 20px;
  border: none;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}

.controls button:hover {
  background: rgba(255, 255, 255, 0.25);
}

.controls button.off {
  background: rgba(255, 255, 255, 0.4);
}

.controls button.hangup {
  background: #e53e3e;
}

.controls button.hangup:hover {
  background: #c53030;
}

.ringing {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 300;
}

.ringing-card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: var(--shadow);
  min-width: 260px;
}

.ringing-card p {
  margin: 0 0 12px;
  color: var(--text-h);
}

.ringing-actions {
  display: flex;
  gap: 8px;
}

.ringing-actions button {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 6px;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}

.ringing-actions .accept {
  background: #38a169;
  color: white;
}

.ringing-actions .reject {
  background: #e53e3e;
  color: white;
}
</style>
