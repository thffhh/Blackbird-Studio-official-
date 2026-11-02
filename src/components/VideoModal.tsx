import React, { useRef, useState, useEffect } from 'react';
import { Project } from '../types/index.ts';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Calendar, Tag, Sparkles } from 'lucide-react';

interface VideoModalProps {
  project: Project | null;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ project, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [project]);

  if (!project) return null;

  // Check if YouTube URL
  const isYouTube = project.videoUrl.includes('youtube.com') || project.videoUrl.includes('youtu.be');
  const getYouTubeEmbedUrl = (url: string) => {
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1].split('&')[0];
    } else if (url.includes('embed/')) {
      return url;
    }
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl bg-[#0e0e13] border border-amber-500/40 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.25)] flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-[#121218]">
          <div className="flex items-center gap-2 truncate">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-xs uppercase border border-amber-500/30">
              {project.animeName}
            </span>
            <span className="text-zinc-400 text-xs truncate">
              {project.episodeNumber}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close video player"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Container */}
        <div ref={containerRef} className="relative aspect-video bg-black flex items-center justify-center group overflow-hidden">
          {isYouTube ? (
            <iframe
              src={getYouTubeEmbedUrl(project.videoUrl)}
              title={project.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              <video
                ref={videoRef}
                src={project.videoUrl}
                poster={project.thumbnailUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                onClick={togglePlay}
                className="w-full h-full object-contain cursor-pointer"
                playsInline
              />

              {/* Big Center Play Button if paused */}
              {!isPlaying && (
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-amber-500/90 hover:bg-amber-400 text-black flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.6)] cursor-pointer hover:scale-110 active:scale-95 transition-all z-10"
                  aria-label="Play video"
                >
                  <Play className="w-8 h-8 fill-black translate-x-0.5" />
                </button>
              )}

              {/* Player Overlay Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/70 to-transparent opacity-90 transition-opacity flex flex-col gap-2">
                {/* Progress bar */}
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-zinc-700 accent-amber-400 rounded-lg cursor-pointer"
                />

                <div className="flex items-center justify-between text-xs text-white">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={togglePlay} 
                      className="p-1 hover:text-amber-400 transition-colors"
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                    </button>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={toggleMute} 
                        className="p-1 hover:text-amber-400"
                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1 bg-zinc-700 accent-amber-400 rounded cursor-pointer hidden sm:block"
                      />
                    </div>

                    <span className="text-[11px] text-zinc-300 font-mono">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleFullscreen}
                      className="p-1 hover:text-amber-400 transition-colors"
                      aria-label="Toggle Fullscreen"
                    >
                      <Maximize className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Project Info Under Video */}
        <div className="p-5 overflow-y-auto space-y-3 bg-[#0d0d12]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg sm:text-xl font-heading font-bold text-white">
              {project.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                {project.releaseDate}
              </span>
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                {project.category}
              </span>
            </div>
          </div>

          <p className="text-sm text-zinc-300 leading-relaxed font-light">
            {project.description}
          </p>

          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1 text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Official BlackBird Studio Bangla Dubbing Project
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
