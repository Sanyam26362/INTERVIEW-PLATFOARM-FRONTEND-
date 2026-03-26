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

  // FIX #2: Mirror localStream in a ref so socket handlers can read the
  // current value without being listed as effect dependencies.
  // Putting `localStream` (state) in the useEffect dep array caused the
  // effect to tear down and re-register every WebRTC listener the moment
  // initLocalStream() resolved — dropping ICE candidates mid-negotiation.
  const localStreamRef = useRef<MediaStream | null>(null);

  const initLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      localStreamRef.current = stream; // keep ref in sync
      return stream;
    } catch (error) {
      console.error('Error accessing media devices.', error);
      toast.error('Could not access camera or microphone.');
      return null;
    }
  }, []);

  const flushIceQueue = useCallback(async (pc: RTCPeerConnection) => {
    while (iceQueueRef.current.length > 0) {
      const candidate = iceQueueRef.current.shift();
      if (candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('Failed to add queued ICE candidate:', e);
        }
      }
    }
  }, []);

  // Creates a bare PeerConnection (no tracks) and wires up event handlers.
  // Tracks are added separately so the answerer can call setRemoteDescription
  // first (see handleOffer below).
  const createPeerConnection = useCallback(() => {
    if (pcRef.current && pcRef.current.signalingState !== 'closed') {
      return pcRef.current;
    }

    const pc = new RTCPeerConnection(getIceServers());
    pcRef.current = pc;
    remoteDescSetRef.current = false;
    iceQueueRef.current = [];

    setRemoteStream(null);

    pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        // Fallback: assemble an inbound stream from individual tracks
        setRemoteStream((prev) => {
          const next = prev ? new MediaStream(prev.getTracks()) : new MediaStream();
          next.addTrack(event.track);
          return next;
        });
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc_ice_candidate', {
          sessionId,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE Connection State:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        console.warn('ICE failed — attempting restart');
        pc.restartIce();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Peer Connection State:', pc.connectionState);
    };

    return pc;
  }, [socket, sessionId]);

  useEffect(() => {
    if (!socket) return;

    const handleOffer = async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
      try {
        // Ensure we have a local stream ready before touching the PC
        let stream = localStreamRef.current;
        if (!stream) {
          stream = await initLocalStream();
          if (!stream) return;
        }

        const pc = createPeerConnection();

        if (pc.signalingState !== 'stable') {
          console.warn('Received offer in non-stable state:', pc.signalingState);
          return;
        }

        // FIX #1: Set remote description BEFORE adding local tracks.
        // Adding tracks first (old code) created extra transceivers that didn't
        // match the offer, so the answerer's video was never sent back correctly.
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        remoteDescSetRef.current = true;
        await flushIceQueue(pc);

        // Now add local tracks — they slot into the transceivers the offer created
        stream.getTracks().forEach((track) => {
          // Avoid adding duplicate tracks if the PC was reused
          const alreadyAdded = pc.getSenders().some((s) => s.track === track);
          if (!alreadyAdded) pc.addTrack(track, stream!);
        });

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc_answer', { sessionId, answer });
      } catch (error) {
        console.error('Failed to handle offer:', error);
      }
    };

    const handleAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      try {
        const pc = pcRef.current;
        if (!pc) return;

        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          remoteDescSetRef.current = true;
          await flushIceQueue(pc);
        }
      } catch (error) {
        console.error('Failed to handle answer:', error);
      }
    };

    const handleIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      try {
        const pc = pcRef.current;
        if (!pc || !remoteDescSetRef.current) {
          iceQueueRef.current.push(candidate);
          return;
        }
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Failed to handle ICE candidate:', error);
      }
    };

    socket.on('webrtc_offer', handleOffer);
    socket.on('webrtc_answer', handleAnswer);
    socket.on('webrtc_ice_candidate', handleIceCandidate);

    return () => {
      socket.off('webrtc_offer', handleOffer);
      socket.off('webrtc_answer', handleAnswer);
      socket.off('webrtc_ice_candidate', handleIceCandidate);
    };

    // FIX #2 (continued): `localStream` (state) deliberately excluded.
    // Handlers read `localStreamRef.current` instead, so this effect stays
    // stable for the lifetime of the socket connection and never drops
    // ICE candidates due to a mid-negotiation re-registration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, sessionId, createPeerConnection, initLocalStream, flushIceQueue]);

  const startCall = useCallback(async () => {
    let stream = localStreamRef.current;
    if (!stream) {
      stream = await initLocalStream();
    }
    if (!stream) return;

    const pc = createPeerConnection();

    // Add tracks for the offerer side (straightforward — no remote desc yet)
    stream.getTracks().forEach((track) => {
      const alreadyAdded = pc.getSenders().some((s) => s.track === track);
      if (!alreadyAdded) pc.addTrack(track, stream!);
    });

    if (pc.signalingState !== 'stable') {
      console.warn('Cannot create offer in state:', pc.signalingState);
      return;
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    if (socket) {
      socket.emit('webrtc_offer', { sessionId, offer });
      toast.success('Joining live interview stream...');
    }
  }, [initLocalStream, createPeerConnection, socket, sessionId]);

  const stopCall = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
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

  return { localStream, remoteStream, startCall, stopCall };
}