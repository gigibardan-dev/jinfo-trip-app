-- Create messages table with existing message_type enum
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
  message_type = 'individual' AND
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