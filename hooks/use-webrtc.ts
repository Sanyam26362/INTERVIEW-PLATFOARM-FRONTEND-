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

  const initLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
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

  const createPeerConnection = useCallback(
    (stream: MediaStream) => {
      if (pcRef.current && pcRef.current.signalingState !== 'closed') {
        return pcRef.current;
      }

      const pc = new RTCPeerConnection(getIceServers());
      pcRef.current = pc;
      remoteDescSetRef.current = false;
      iceQueueRef.current = [];

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const inboundStream = new MediaStream();
      setRemoteStream(null);

      pc.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        } else {
          inboundStream.addTrack(event.track);
          setRemoteStream(new MediaStream(inboundStream.getTracks()));
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
    },
    [socket, sessionId]
  );

  useEffect(() => {
    if (!socket) return;

    const handleOffer = async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
      try {
        let stream = localStream;
        if (!stream) {
          stream = await initLocalStream();
          if (!stream) return;
        }

        const pc = createPeerConnection(stream);

        if (pc.signalingState !== 'stable') {
          console.warn('Received offer in non-stable state:', pc.signalingState);
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        remoteDescSetRef.current = true;
        await flushIceQueue(pc);

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
  }, [socket, sessionId, localStream, createPeerConnection, initLocalStream, flushIceQueue]);

  const startCall = useCallback(async () => {
    let stream = localStream;
    if (!stream) {
      stream = await initLocalStream();
    }
    if (!stream) return;

    const pc = createPeerConnection(stream);

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
  }, [localStream, initLocalStream, createPeerConnection, socket, sessionId]);

  const stopCall = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    iceQueueRef.current = [];
    remoteDescSetRef.current = false;
  }, [localStream]);

  useEffect(() => {
    return () => {
      if (pcRef.current) pcRef.current.close();
      if (localStream) localStream.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { localStream, remoteStream, startCall, stopCall };
}