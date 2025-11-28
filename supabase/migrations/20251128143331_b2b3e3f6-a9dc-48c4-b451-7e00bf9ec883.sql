-- Asigură-te că chat_messages are REPLICA IDENTITY FULL pentru realtime
ALTER TABLE chat_messages REPLICA IDENTITY FULL;