-- Allow participants to update read status of messages in their conversations
CREATE POLICY "Users can update read status in their conversations"
ON public.chat_messages
FOR UPDATE
USING (is_conversation_participant(conversation_id, auth.uid()))
WITH CHECK (
  is_conversation_participant(conversation_id, auth.uid())
  AND sender_id <> auth.uid()
);