-- Drop and recreate the guide insert policy on conversations to allow guides to create group chats
DROP POLICY IF EXISTS "Guides can create conversations" ON public.conversations;

CREATE POLICY "Guides can create group conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  conversation_type = 'group' 
  AND is_guide()
);