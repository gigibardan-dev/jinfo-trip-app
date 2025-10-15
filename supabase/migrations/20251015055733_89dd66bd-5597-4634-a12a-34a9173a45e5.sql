-- Create security definer function to check if user is participant in conversation
CREATE OR REPLACE FUNCTION public.is_conversation_participant(conversation_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = conversation_uuid
      AND user_id = user_uuid
  );
$$;

-- Drop existing policies for conversation_participants
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Admins can manage all participants" ON public.conversation_participants;

-- Create new policies using security definer function
CREATE POLICY "Users can view participants in their conversations"
ON public.conversation_participants
FOR SELECT
USING (
  is_admin() OR 
  is_conversation_participant(conversation_id, auth.uid())
);

CREATE POLICY "Admins can manage all participants"
ON public.conversation_participants
FOR ALL
USING (is_admin());

-- Drop existing policies for conversations
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Admins can manage all conversations" ON public.conversations;
DROP POLICY IF EXISTS "Guides can create conversations" ON public.conversations;

-- Create new policies for conversations
CREATE POLICY "Users can view conversations they participate in"
ON public.conversations
FOR SELECT
USING (
  is_admin() OR 
  is_conversation_participant(id, auth.uid())
);

CREATE POLICY "Admins can manage all conversations"
ON public.conversations
FOR ALL
USING (is_admin());

CREATE POLICY "Guides can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (is_guide());

-- Drop existing policies for chat_messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.chat_messages;

-- Create new policies for chat_messages
CREATE POLICY "Users can view messages in their conversations"
ON public.chat_messages
FOR SELECT
USING (
  is_admin() OR 
  is_conversation_participant(conversation_id, auth.uid())
);

CREATE POLICY "Users can send messages to their conversations"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND 
  is_conversation_participant(conversation_id, auth.uid())
);

CREATE POLICY "Admins can manage all messages"
ON public.chat_messages
FOR ALL
USING (is_admin());