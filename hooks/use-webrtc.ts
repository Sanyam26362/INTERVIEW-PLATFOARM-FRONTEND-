import { useState, useRef, useEffect, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import { toast } from 'sonner';

const getIceServers = (): RTCConfiguration => {
  const iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];
  if (
    process.env.NEXT_PUBLIC_TURN_URL &&
    process.env.NEXT_PUBLIC_TURN_USERNAME &&
    process.env.NEXT_PUBLIC_TURN_CREDENTIAL
  ) {
    iceServers.push({
      urls: process.env.NEXT_PUBLIC_TURN_URL,
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    });
  }
  return { iceServers };
};

export function useWebRTC(socket: Socket | null, sessionId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const iceQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSetRef = useRef(false);

  // BUG FIX 3: Mirror localStream in a ref so WebRTC socket listeners never need
  // localStream as a useEffect dependency. Having it as a dep caused the effect
  // to tear down and re-register all three WebRTC listeners (including
  // webrtc_ice_candidate) the moment initLocalStream() resolved — dropping any
  // ICE candidates that arrived during that brief re-registration window.
  const localStreamRef = useRef<MediaStream | null>(null);

  // Exported so chat-panel can pre-init the camera without triggering an offer.
  const initLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      localStreamRef.current = stream;
      console.log('[WebRTC] local stream ready, tracks:', stream.getTracks().map(t => t.kind));
      return stream;
    } catch (error) {
      console.error('[WebRTC] getUserMedia failed:', error);
      toast.error('Could not access camera or microphone.');
      return null;
    }
  }, []);

  const flushIceQueue = useCallback(async (pc: RTCPeerConnection) => {
    console.log(`[WebRTC] flushing ${iceQueueRef.current.length} queued ICE candidates`);
    while (iceQueueRef.current.length > 0) {
      const candidate = iceQueueRef.current.shift();
      if (candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[WebRTC] failed to add queued ICE candidate:', e);
        }
      }
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    if (pcRef.current && pcRef.current.signalingState !== 'closed') {
      console.log('[WebRTC] reusing existing PC, state:', pcRef.current.signalingState);
      return pcRef.current;
    }

    console.log('[WebRTC] creating new RTCPeerConnection');
    const pc = new RTCPeerConnection(getIceServers());
    pcRef.current = pc;
    remoteDescSetRef.current = false;
    iceQueueRef.current = [];
    setRemoteStream(null);

    pc.ontrack = (event) => {
      console.log('[WebRTC] ontrack fired, kind:', event.track.kind, 'streams:', event.streams.length);
      if (event.streams?.[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        setRemoteStream((prev) => {
          const next = prev ? new MediaStream(prev.getTracks()) : new MediaStream();
          next.addTrack(event.track);
          return next;
        });
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        console.log('[WebRTC] sending ICE candidate');
        socket.emit('webrtc_ice_candidate', { sessionId, candidate: event.candidate });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        console.warn('[WebRTC] ICE failed — restarting');
        pc.restartIce();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] connection state:', pc.connectionState);
    };

    pc.onsignalingstatechange = () => {
      console.log('[WebRTC] signaling state:', pc.signalingState);
    };

    return pc;
  }, [socket, sessionId]);

  useEffect(() => {
    if (!socket) return;
    console.log('[WebRTC] registering socket listeners on', socket.id);

    const handleOffer = async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] received offer');
      try {
        // Ensure camera is ready before touching the PC.
        let stream = localStreamRef.current;
        if (!stream) {
          console.log('[WebRTC] no local stream yet, initialising…');
          stream = await initLocalStream();
          if (!stream) {
            console.error('[WebRTC] could not get local stream, aborting offer handling');
            return;
          }
        }

        const pc = createPeerConnection();

        if (pc.signalingState !== 'stable') {
          console.warn('[WebRTC] offer arrived in non-stable state:', pc.signalingState, '— ignoring');
          return;
        }

        // BUG FIX 2 (answerer side): Set remote description BEFORE adding local
        // tracks. The offer's m-lines define the transceivers; adding tracks first
        // creates extra, mismatched transceivers, so the answerer's video is never
        // assigned to the correct transceiver on the offerer's side.
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        remoteDescSetRef.current = true;
        console.log('[WebRTC] remote description set (offer)');
        await flushIceQueue(pc);

        // Add tracks into the transceivers the offer just created.
        stream.getTracks().forEach((track) => {
          const alreadyAdded = pc.getSenders().some((s) => s.track === track);
          if (!alreadyAdded) {
            pc.addTrack(track, stream!);
            console.log('[WebRTC] added local track:', track.kind);
          }
        });

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('[WebRTC] sending answer');
        socket.emit('webrtc_answer', { sessionId, answer });
      } catch (error) {
        console.error('[WebRTC] handleOffer failed:', error);
      }
    };

    const handleAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] received answer');
      try {
        const pc = pcRef.current;
        if (!pc) { console.warn('[WebRTC] no PC when answer arrived'); return; }
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          remoteDescSetRef.current = true;
          console.log('[WebRTC] remote description set (answer)');
          await flushIceQueue(pc);
        } else {
          console.warn('[WebRTC] answer arrived in unexpected state:', pc.signalingState);
        }
      } catch (error) {
        console.error('[WebRTC] handleAnswer failed:', error);
      }
    };

    const handleIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      const pc = pcRef.current;
      if (!pc || !remoteDescSetRef.current) {
        console.log('[WebRTC] queuing ICE candidate (no PC or remote desc yet)');
        iceQueueRef.current.push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('[WebRTC] addIceCandidate failed:', error);
      }
    };

    socket.on('webrtc_offer', handleOffer);
    socket.on('webrtc_answer', handleAnswer);
    socket.on('webrtc_ice_candidate', handleIceCandidate);
    console.log('[WebRTC] listeners registered');

    return () => {
      socket.off('webrtc_offer', handleOffer);
      socket.off('webrtc_answer', handleAnswer);
      socket.off('webrtc_ice_candidate', handleIceCandidate);
      console.log('[WebRTC] listeners removed');
    };

    // localStream deliberately NOT in deps — see BUG FIX 3 above.
    // Handlers read localStreamRef.current instead, so the effect stays stable
    // for the lifetime of the socket and never drops ICE candidates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, sessionId, createPeerConnection, initLocalStream, flushIceQueue]);

  // Called by the peer who was already in the room (receives peer_joined).
  // Initialises camera then creates and sends the offer.
  const startCall = useCallback(async () => {
    console.log('[WebRTC] startCall invoked');
    let stream = localStreamRef.current;
    if (!stream) stream = await initLocalStream();
    if (!stream) { console.error('[WebRTC] startCall: no stream, aborting'); return; }

    const pc = createPeerConnection();

    // Add tracks for the offerer side.
    stream.getTracks().forEach((track) => {
      const alreadyAdded = pc.getSenders().some((s) => s.track === track);
      if (!alreadyAdded) {
        pc.addTrack(track, stream!);
        console.log('[WebRTC] offerer added track:', track.kind);
      }
    });

    if (pc.signalingState !== 'stable') {
      console.warn('[WebRTC] startCall: unexpected signaling state:', pc.signalingState);
      return;
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log('[WebRTC] sending offer');

    if (socket) {
      socket.emit('webrtc_offer', { sessionId, offer });
      toast.success('Joining live interview stream…');
    } else {
      console.error('[WebRTC] startCall: socket is null, offer not sent!');
    }
  }, [initLocalStream, createPeerConnection, socket, sessionId]);

  const stopCall = useCallback(() => {
    console.log('[WebRTC] stopCall');
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    iceQueueRef.current = [];
    remoteDescSetRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      if (pcRef.current) pcRef.current.close();
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { localStream, remoteStream, startCall, stopCall, initLocalStream };
}