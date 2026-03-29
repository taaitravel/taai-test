import { useState, useRef } from 'react';
import { ChatMessage as ChatMessageType } from '@/hooks/useItineraryChat';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Heart, MoreVertical, Reply, Copy, Pencil, Trash2, Plane, Building2, MapPin, Utensils } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: ChatMessageType;
  onReply: (message: ChatMessageType) => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  onReact: (messageId: string) => void;
}

const categoryIcons: Record<string, any> = {
  flights: Plane,
  hotels: Building2,
  activities: MapPin,
  reservations: Utensils,
};

export const ChatMessageComponent = ({ message, onReply, onEdit, onDelete, onReact }: ChatMessageProps) => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content || '');
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const isMine = message.sender_id === user?.id;
  const senderName = message.sender
    ? `${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim() || message.sender.username || 'User'
    : 'User';
  const initials = senderName.slice(0, 2).toUpperCase();

  const canEdit = isMine && !message.deleted && (Date.now() - new Date(message.created_at).getTime()) < 10 * 60 * 1000;
  const canDelete = isMine && !message.deleted;

  const likeCount = message.reactions.filter((r) => r.reaction === 'like').length;
  const iLiked = message.reactions.some((r) => r.user_id === user?.id && r.reaction === 'like');

  const handleCopy = () => {
    if (message.content) navigator.clipboard.writeText(message.content);
  };

  const handleEditSubmit = () => {
    if (editText.trim()) onEdit(message.id, editText.trim());
    setEditing(false);
  };

  // Long press for mobile
  const onTouchStart = () => {
    longPressTimer.current = setTimeout(() => setShowMenu(true), 500);
  };
  const onTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  if (message.deleted) {
    return (
      <div className={cn('flex gap-2 px-4 py-1', isMine && 'flex-row-reverse')}>
        <div className="max-w-[75%] rounded-2xl px-4 py-2 bg-muted/50">
          <p className="text-xs italic text-muted-foreground">This message was deleted</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('group flex gap-2 px-4 py-1', isMine && 'flex-row-reverse')}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onContextMenu={(e) => { e.preventDefault(); setShowMenu(true); }}
    >
      {!isMine && (
        <Avatar className="h-7 w-7 mt-1 shrink-0">
          <AvatarImage src={message.sender?.avatar_url || ''} />
          <AvatarFallback className="text-[10px] bg-primary/20 text-primary">{initials}</AvatarFallback>
        </Avatar>
      )}

      <div className={cn('max-w-[75%] flex flex-col', isMine ? 'items-end' : 'items-start')}>
        {!isMine && <span className="text-[10px] text-muted-foreground ml-1 mb-0.5">{senderName}</span>}

        {/* Reply preview */}
        {message.reply_to && !message.reply_to.deleted && (
          <div className={cn(
            'text-[10px] px-3 py-1 rounded-t-xl border-l-2 border-primary/50 bg-muted/30 max-w-full truncate mb-0.5',
            isMine ? 'rounded-tr-none' : 'rounded-tl-none'
          )}>
            <span className="font-medium text-primary/70">
              {message.reply_to.sender_id === user?.id ? 'You' : 'Reply'}
            </span>
            <span className="ml-1 text-muted-foreground">{message.reply_to.content?.slice(0, 60)}</span>
          </div>
        )}

        <div className={cn(
          'rounded-2xl px-4 py-2 relative',
          isMine
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-card border border-border rounded-tl-sm'
        )}>
          {editing ? (
            <div className="flex gap-1 items-center">
              <input
                className="bg-transparent text-sm outline-none flex-1 min-w-0"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit()}
                autoFocus
              />
              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={handleEditSubmit}>Save</Button>
              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          ) : (
            <>
              {message.content && <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>}

              {/* Attachment rendering */}
              {message.attachment_type === 'image' && message.attachment_data?.url && (
                <img
                  src={message.attachment_data.url}
                  alt="Shared image"
                  className="rounded-lg max-w-full max-h-60 object-cover mt-1"
                />
              )}

              {message.attachment_type === 'itinerary_card' && message.attachment_data && (
                <div className="mt-1 p-2 rounded-lg bg-background/20 border border-border/30">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    {categoryIcons[message.attachment_data.category] &&
                      (() => { const Icon = categoryIcons[message.attachment_data.category]; return <Icon className="h-3 w-3" />; })()
                    }
                    <span>{message.attachment_data.name || message.attachment_data.category}</span>
                  </div>
                  {message.attachment_data.details && (
                    <p className="text-[10px] opacity-70 mt-0.5">{message.attachment_data.details}</p>
                  )}
                </div>
              )}

              {message.attachment_type === 'calendar_event' && message.attachment_data && (
                <div className="mt-1 p-2 rounded-lg bg-background/20 border border-border/30">
                  <p className="text-xs font-medium">📅 {message.attachment_data.date}</p>
                  {message.attachment_data.description && (
                    <p className="text-[10px] opacity-70">{message.attachment_data.description}</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Timestamp + edited */}
          <div className={cn('flex items-center gap-1 mt-0.5', isMine ? 'justify-end' : 'justify-start')}>
            <span className={cn('text-[9px]', isMine ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
              {format(new Date(message.created_at), 'h:mm a')}
            </span>
            {message.edited_at && (
              <span className={cn('text-[9px] italic', isMine ? 'text-primary-foreground/50' : 'text-muted-foreground/70')}>
                edited
              </span>
            )}
          </div>
        </div>

        {/* Reactions */}
        <div className="flex items-center gap-1 mt-0.5">
          <button
            onClick={() => onReact(message.id)}
            className={cn(
              'flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full transition-colors',
              iLiked ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground'
            )}
          >
            <Heart className={cn('h-3 w-3', iLiked && 'fill-current')} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>

          {/* Quick reply on hover (desktop) */}
          <button
            onClick={() => onReply(message)}
            className="opacity-0 group-hover:opacity-100 text-[10px] px-1.5 py-0.5 rounded-full hover:bg-muted text-muted-foreground transition-opacity"
          >
            <Reply className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Context menu */}
      <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
        <DropdownMenuTrigger asChild>
          <button className="opacity-0 group-hover:opacity-100 self-center transition-opacity">
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isMine ? 'end' : 'start'} className="min-w-[140px]">
          <DropdownMenuItem onClick={() => onReply(message)}>
            <Reply className="h-3.5 w-3.5 mr-2" /> Reply
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5 mr-2" /> Copy
          </DropdownMenuItem>
          {canEdit && (
            <DropdownMenuItem onClick={() => { setEditing(true); setShowMenu(false); }}>
              <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem onClick={() => onDelete(message.id)} className="text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
