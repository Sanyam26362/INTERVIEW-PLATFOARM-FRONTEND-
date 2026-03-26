import { useState, useRef, useEffect, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import { toast } from 'sonner';

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

export function useWebRTC(socket: Socket | null, sessionId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const initLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error("Error accessing media devices.", error);
      toast.error("Could not access camera or microphone.");
      return null;
    }
  }, []);

  const createPeerConnection = useCallback((stream: MediaStream) => {
    if (pcRef.current) return pcRef.current;
    
    const pc = new RTCPeerConnection(STUN_SERVERS);
    pcRef.current = pc;

    // Add local tracks to PC
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    // Handle incoming remote tracks
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("webrtc_ice_candidate", { sessionId, candidate: event.candidate });
      }
    };

    return pc;
  }, [socket, sessionId]);

  useEffect(() => {
    if (!socket) return;

    const handleOffer = async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
      try {
        if (!pcRef.current) {
           // Create PC if it doesn't exist (e.g. this is the receiver)
           const stream = localStream || await initLocalStream();
           if (!stream) return;
           createPeerConnection(stream);
        }
        
        const pc = pcRef.current!;
        
        // FIX: Only accept an offer if we are in a stable state
        if (pc.signalingState !== "stable") {
          console.warn("Ignoring offer, connection is not stable:", pc.signalingState);
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc_answer", { sessionId, answer });
      } catch (error) {
        console.error("Failed to handle offer:", error);
      }
    };

    const handleAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      try {
        const pc = pcRef.current;
        if (!pc) return;

        // FIX: Only accept an answer if we actually sent an offer!
        if (pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } else {
          console.warn("Ignoring redundant answer. Current state:", pc.signalingState);
        }
      } catch (error) {
        console.error("Failed to handle answer:", error);
      }
    };

    const handleIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      try {
        const pc = pcRef.current;
        if (!pc) return;

        // FIX: Only process ICE candidates if we have started the handshake
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.error("Failed to handle ICE candidate:", error);
      }
    };

    // Attach listeners with specific function references for clean removal
    socket.on("webrtc_offer", handleOffer);
    socket.on("webrtc_answer", handleAnswer);
    socket.on("webrtc_ice_candidate", handleIceCandidate);

    return () => {
      socket.off("webrtc_offer", handleOffer);
      socket.off("webrtc_answer", handleAnswer);
      socket.off("webrtc_ice_candidate", handleIceCandidate);
    };
  }, [socket, sessionId, localStream, createPeerConnection, initLocalStream]);

  const startCall = useCallback(async () => {
    let stream = localStream;
    if (!stream) {
      stream = await initLocalStream();
    }
    if (!stream) return;

    const pc = createPeerConnection(stream);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    if (socket) {
      socket.emit("webrtc_offer", { sessionId, offer });
      toast.success("Joining live interview stream...");
    }
  }, [localStream, initLocalStream, createPeerConnection, socket, sessionId]);

  const stopCall = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
  }, [localStream]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pcRef.current) {
        pcRef.current.close();
      }
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []); // Intentionally empty to only run on unmount

  return { localStream, remoteStream, startCall, stopCall };
}
