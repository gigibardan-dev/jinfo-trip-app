import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ConversationList } from "./ConversationList";
import { MessageThread } from "./MessageThread";

interface Conversation {
  id: string;
  conversation_type: 'direct' | 'group' | 'broadcast';
  title?: string;
  group_id?: string;
  created_at: string;
  updated_at: string;
  participants?: any[];
  last_message?: any;
  unread_count?: number;
}

interface MessagingSystemProps {
  userRole?: 'admin' | 'guide' | 'tourist';
}

export const MessagingSystem = ({ userRole }: MessagingSystemProps = {}) => {
  const { user, profile } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const isAdmin = profile?.role === 'admin';
  const isGuide = profile?.role === 'guide';
  const canInitiateChat = isAdmin || isGuide;

  // Reset selection when user changes
  useEffect(() => {
    if (!user) {
      setSelectedConversation(null);
    }
  }, [user]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleMessagesRead = () => {
    // Trigger refresh of conversation list to update unread counts
    setRefreshKey(prev => prev + 1);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Autentifică-te pentru a vedea mesajele</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Layout - Side by side */}
      <div className="hidden lg:flex h-[calc(100vh-12rem)] border rounded-xl overflow-hidden shadow-xl bg-background">
        <div className="w-[380px] border-r flex-shrink-0">
          <ConversationList
            key={refreshKey}
            selectedConversationId={selectedConversation?.id || null}
            onSelectConversation={handleSelectConversation}
            currentUserId={user.id}
            canInitiateChat={canInitiateChat}
            isAdmin={isAdmin}
            isGuide={isGuide}
          />
        </div>
        
        {selectedConversation ? (
          <MessageThread
            conversation={selectedConversation}
            currentUserId={user.id}
            onMessagesRead={handleMessagesRead}
            showBackButton={false}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center p-4 sm:p-8">
              <MessageCircle className="w-12 sm:w-16 h-12 sm:h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">Selectează o conversație</h3>
              <p className="text-sm text-muted-foreground">
                Alege o conversație din listă pentru a începe să comunici
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Layout - Full screen toggle */}
      <div className="lg:hidden">
        {selectedConversation ? (
          <div className="fixed inset-0 top-14 bottom-16 border-t bg-background flex flex-col z-10">
            <MessageThread
              conversation={selectedConversation}
              currentUserId={user.id}
              onMessagesRead={handleMessagesRead}
              onBack={handleBackToList}
              showBackButton={true}
            />
          </div>
        ) : (
          <div className="h-[calc(100vh-8rem)] sm:h-[calc(100vh-10rem)] border rounded-xl overflow-hidden shadow-xl bg-background">
            <ConversationList
              key={refreshKey}
              selectedConversationId={null}
              onSelectConversation={handleSelectConversation}
              currentUserId={user.id}
              canInitiateChat={canInitiateChat}
              isAdmin={isAdmin}
              isGuide={isGuide}
            />
          </div>
        )}
      </div>
    </>
  );
};
