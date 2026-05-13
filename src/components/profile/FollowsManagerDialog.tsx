import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFollows, type FollowRow } from "@/hooks/useFollows";
import { Check, X, UserMinus } from "lucide-react";

const Row = ({ row, actions }: { row: FollowRow; actions: React.ReactNode }) => {
  const name =
    [row.profile?.first_name, row.profile?.last_name].filter(Boolean).join(" ") ||
    row.profile?.username ||
    "Traveler";
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-9 w-9">
          <AvatarImage src={row.profile?.avatar_url || undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{name}</p>
          {row.profile?.username && (
            <p className="text-xs text-muted-foreground truncate">@{row.profile.username}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2">{actions}</div>
    </div>
  );
};

const Empty = ({ label }: { label: string }) => (
  <p className="text-sm text-muted-foreground py-8 text-center">{label}</p>
);

export const FollowsManagerDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const { following, followers, pendingIncoming, pendingOutgoing, accept, remove } = useFollows();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Travellers</DialogTitle>
          <DialogDescription>Manage who you follow and who follows you.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="following" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="following">Following ({following.length})</TabsTrigger>
            <TabsTrigger value="followers">Followers ({followers.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingIncoming.length + pendingOutgoing.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="following" className="flex-1 overflow-hidden mt-3">
            <ScrollArea className="h-[50vh] pr-3">
              {following.length === 0 ? (
                <Empty label="You're not following anyone yet." />
              ) : (
                following.map((r) => (
                  <Row
                    key={r.id}
                    row={r}
                    actions={
                      <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                        <UserMinus className="h-4 w-4 mr-1" /> Unfollow
                      </Button>
                    }
                  />
                ))
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="followers" className="flex-1 overflow-hidden mt-3">
            <ScrollArea className="h-[50vh] pr-3">
              {followers.length === 0 ? (
                <Empty label="No followers yet." />
              ) : (
                followers.map((r) => (
                  <Row
                    key={r.id}
                    row={r}
                    actions={
                      <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                        Remove
                      </Button>
                    }
                  />
                ))
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="pending" className="flex-1 overflow-hidden mt-3">
            <ScrollArea className="h-[50vh] pr-3 space-y-4">
              {pendingIncoming.length === 0 && pendingOutgoing.length === 0 ? (
                <Empty label="No pending requests." />
              ) : (
                <>
                  {pendingIncoming.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                        Incoming
                      </p>
                      {pendingIncoming.map((r) => (
                        <Row
                          key={r.id}
                          row={r}
                          actions={
                            <>
                              <Button size="sm" onClick={() => accept(r.id)}>
                                <Check className="h-4 w-4 mr-1" /> Accept
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          }
                        />
                      ))}
                    </div>
                  )}
                  {pendingOutgoing.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                        Sent
                      </p>
                      {pendingOutgoing.map((r) => (
                        <Row
                          key={r.id}
                          row={r}
                          actions={
                            <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                              Cancel
                            </Button>
                          }
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};