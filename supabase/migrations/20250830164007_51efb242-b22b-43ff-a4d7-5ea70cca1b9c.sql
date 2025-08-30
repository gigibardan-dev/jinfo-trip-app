-- Add group member for admin to existing group
INSERT INTO public.group_members (group_id, user_id, role_in_group)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '46d5027b-7290-4f17-adae-49121039b720',
    'leader'
) ON CONFLICT DO NOTHING;