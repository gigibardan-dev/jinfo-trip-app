-- Add message status column to chat_messages
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS read_at timestamp with time zone;

-- Update existing messages to set delivered_at
UPDATE public.chat_messages 
SET delivered_at = created_at 
WHERE delivered_at IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_unread 
ON public.chat_messages(conversation_id, is_read) 
WHERE is_read = false;

-- Create index for delivered messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_delivered 
ON public.chat_messages(delivered_at) 
WHERE delivered_at IS NOT NULL;