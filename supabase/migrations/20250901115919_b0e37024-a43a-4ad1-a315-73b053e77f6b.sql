-- Create enum for message types
CREATE TYPE message_type AS ENUM ('direct', 'group', 'broadcast');

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id UUID NULL REFERENCES public.tourist_groups(id) ON DELETE CASCADE,
  message_type message_type NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Admins can manage all messages"
ON public.messages
FOR ALL
USING (is_admin());

CREATE POLICY "Users can view their messages"
ON public.messages
FOR SELECT
USING (
  sender_id = auth.uid() OR 
  recipient_id = auth.uid() OR 
  (message_type = 'group' AND user_in_group(group_id)) OR
  message_type = 'broadcast'
);

CREATE POLICY "Users can send direct messages to admin"
ON public.messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND 
  message_type = 'direct' AND
  EXISTS(SELECT 1 FROM public.profiles WHERE id = recipient_id AND role = 'admin')
);

CREATE POLICY "Admins can send any type of message"
ON public.messages
FOR INSERT
WITH CHECK (
  is_admin() AND sender_id = auth.uid()
);

CREATE POLICY "Users can send group messages to their groups"
ON public.messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND 
  message_type = 'group' AND
  user_in_group(group_id)
);

-- Create trigger for updated_at
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create message_reads table to track read status
CREATE TABLE public.message_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS on message_reads
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- Create policies for message_reads
CREATE POLICY "Users can manage their read status"
ON public.message_reads
FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all read status"
ON public.message_reads
FOR SELECT
USING (is_admin());