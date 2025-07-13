import { useState } from "react";
import { Play, Clock, User } from "lucide-react";
import { Card, CardContent } from "./card";
import { Button } from "./button";

interface CompactVideoProps {
  title: string | { title: string };
  channel: string | { name: string };
  duration: string;
  thumbnail?: string;
  description?: string;
  published?: string;
  videoId?: string;
  onPlay?: () => void;
}

export function CompactVideo({
  title,
  channel,
  duration,
  thumbnail,
  description,
  published,
  videoId,
  onPlay,
}: CompactVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const getYouTubeThumbnail = (videoId: string) => {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  };

  const thumbnailUrl = thumbnail || (videoId ? getYouTubeThumbnail(videoId) : null);

  const handlePlay = () => {
    setIsPlaying(true);
    onPlay?.();
  };

  if (isPlaying && videoId) {
    return (
      <Card className="max-w-md mb-4">
        <CardContent className="p-0">
          <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              title={typeof title === 'string' ? title : (title?.title || 'Untitled')}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
          <div className="p-3">
            <h4 className="font-medium text-sm leading-tight mb-1">
              {typeof title === 'string' ? title : JSON.stringify(title)}
            </h4>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{typeof channel === 'object' && channel?.name ? channel.name : (typeof channel === 'string' ? channel : 'Unknown')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{typeof duration === 'string' ? duration : '0:00'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mb-4 hover:shadow-md transition-shadow cursor-pointer group" onClick={handlePlay}>
      <CardContent className="p-0">
        <div className="relative">
          <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-700 rounded-t-lg overflow-hidden">
            {thumbnailUrl ? (
              <>
                <img
                  src={thumbnailUrl}
                  alt={typeof title === 'string' ? title : (title?.title || 'Untitled')}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src.includes('hqdefault')) {
                      target.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                    } else if (target.src.includes('mqdefault')) {
                      target.src = `https://img.youtube.com/vi/${videoId}/default.jpg`;
                    } else {
                      target.style.display = 'none';
                      const fallback = target.parentElement?.querySelector('.fallback-letter');
                      if (fallback) {
                        fallback.classList.remove('hidden');
                      }
                    }
                  }}
                />
                                 <div className="fallback-letter hidden w-full h-full flex items-center justify-center absolute inset-0">
                   <div className="text-4xl font-bold text-white/20">
                     {(typeof title === 'string' ? title : 'V').charAt(0)}
                   </div>
                 </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-4xl font-bold text-white/20">
                  {(typeof title === 'string' ? title : 'V').charAt(0)}
                </div>
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition-colors">
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-full bg-white/90 hover:bg-white text-black hover:scale-110 transition-all duration-300"
              >
                <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
              </Button>
            </div>
            
            <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-xs text-white font-medium">
              {typeof duration === 'string' ? duration : '0:00'}
            </div>
          </div>
        </div>
        
        <div className="p-3">
          <h4 className="font-medium text-sm leading-tight mb-2 line-clamp-2">
            {typeof title === 'string' ? title : (title?.title || 'Untitled')}
          </h4>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{typeof channel === 'object' && channel?.name ? channel.name : (typeof channel === 'string' ? channel : 'Unknown')}</span>
            </div>
            {published && (
              <span>• {typeof published === 'string' ? published : ''}</span>
            )}
          </div>
          
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {typeof description === 'string' ? description : ''}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 