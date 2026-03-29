import { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, X, ImageIcon, FileText, Users } from 'lucide-react';
import { useItineraryChat, ChatMessage } from '@/hooks/useItineraryChat';
import { ChatMessageComponent } from './ChatMessage';
import { ChatAttachmentPicker } from './ChatAttachmentPicker';
import { ItineraryData } from '@/types/itinerary';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ItineraryChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itineraryId: number;
  itineraryData: ItineraryData;
}

export const ItineraryChatModal = ({ open, onOpenChange, itineraryId, itineraryData }: ItineraryChatModalProps) => {
  const {
    messages, participants, loading,
    filter, setFilter, participantFilter, setParticipantFilter,
    sendMessage, editMessage, deleteMessage, toggleReaction, uploadAttachment,
  } = useItineraryChat(itineraryId);

  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    await sendMessage(trimmed, null, null, replyTo?.id || null);
    setReplyTo(null);
    inputRef.current?.focus();
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const url = await uploadAttachment(file);
    if (url) {
      await sendMessage('', 'image', { url }, replyTo?.id || null);
      setReplyTo(null);
    } else {
      toast.error('Failed to upload image');
    }
    setUploading(false);
  };

  const handleCardShare = async (category: string, item: any) => {
    const name = item.name || item.airline || category;
    const details = item.city || item.from || item.date || '';
    await sendMessage('', 'itinerary_card', { category, name, details, item }, replyTo?.id || null);
    setReplyTo(null);
  };

  const handleCalendarShare = async (date: string) => {
    const desc = `${itineraryData.itin_name || 'Trip'}: ${date}${itineraryData.itin_date_end ? ` – ${itineraryData.itin_date_end}` : ''}`;
    await sendMessage('', 'calendar_event', { date, description: desc }, replyTo?.id || null);
    setReplyTo(null);
  };

  const filterTabs: { key: typeof filter; label: string; icon: any }[] = [
    { key: 'all', label: 'All', icon: null },
    { key: 'media', label: 'Media', icon: ImageIcon },
    { key: 'docs', label: 'Docs', icon: FileText },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <SheetHeader className="mb-3">
            <SheetTitle className="text-base font-semibold truncate pr-8">
              {itineraryData.itin_name || 'Trip Chat'}
            </SheetTitle>
          </SheetHeader>

          {/* Participant avatars */}
          <div className="flex items-center gap-1 mb-3">
            <div className="flex -space-x-2">
              {participants.slice(0, 5).map((p) => {
                const name = `${p.user?.first_name || ''} ${p.user?.last_name || ''}`.trim() || 'U';
                return (
                  <Avatar key={p.id} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={p.user?.avatar_url || ''} />
                    <AvatarFallback className="text-[8px] bg-primary/20 text-primary">
                      {name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                );
              })}
            </div>
            {participants.length > 5 && (
              <span className="text-[10px] text-muted-foreground ml-1">+{participants.length - 5}</span>
            )}
            <span className="text-[10px] text-muted-foreground ml-2">{participants.length} members</span>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors',
                    filter === tab.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Select
              value={participantFilter || 'all'}
              onValueChange={(v) => setParticipantFilter(v === 'all' ? null : v)}
            >
              <SelectTrigger className="h-7 w-auto min-w-[100px] text-[11px] border-none bg-muted">
                <Users className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Everyone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                {participants.map((p) => {
                  const name = `${p.user?.first_name || ''} ${p.user?.last_name || ''}`.trim() || p.user?.username || 'User';
                  return (
                    <SelectItem key={p.user_id} value={p.user_id}>{name}</SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 overflow-y-auto" ref={scrollRef as any}>
          <div className="py-4 space-y-1" ref={scrollRef}>
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                <p>No messages yet</p>
                <p className="text-xs mt-1">Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <ChatMessageComponent
                  key={msg.id}
                  message={msg}
                  onReply={setReplyTo}
                  onEdit={editMessage}
                  onDelete={deleteMessage}
                  onReact={toggleReaction}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Reply preview */}
        {replyTo && (
          <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-primary font-medium">Replying to</p>
              <p className="text-xs text-muted-foreground truncate">{replyTo.content || 'Attachment'}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setReplyTo(null)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Input bar */}
        <div className="px-3 py-3 border-t border-border flex items-center gap-2 bg-card">
          <ChatAttachmentPicker
            itineraryData={itineraryData}
            onImageSelected={handleImageUpload}
            onCardSelected={handleCardShare}
            onCalendarSelected={handleCalendarShare}
          />

          <Input
            ref={inputRef}
            placeholder={uploading ? 'Uploading...' : 'Type a message...'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={uploading}
            className="flex-1 h-9 text-sm border-none bg-muted/50 focus-visible:ring-1"
          />

          <Button
            size="icon"
            className="h-9 w-9 shrink-0 gold-gradient hover:opacity-90"
            onClick={handleSend}
            disabled={!text.trim() || uploading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
